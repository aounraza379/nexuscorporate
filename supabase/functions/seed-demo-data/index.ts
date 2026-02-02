import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const testUsers = [
      { email: "hr@test.com", password: "password123", fullName: "HR Administrator", role: "hr" },
      { email: "manager@test.com", password: "password123", fullName: "Team Manager", role: "manager" },
      { email: "employee@test.com", password: "password123", fullName: "John Employee", role: "employee" },
    ];

    const results = [];

    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const exists = existingUsers?.users?.some((u) => u.email === user.email);

      if (exists) {
        results.push({ email: user.email, status: "already exists" });
        continue;
      }

      // Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
        },
      });

      if (error) {
        results.push({ email: user.email, status: "error", error: error.message });
      } else {
        results.push({ email: user.email, status: "created", userId: data.user?.id });
      }
    }

    // Add some sample policies
    const { data: existingPolicies } = await supabase
      .from("company_policies")
      .select("id")
      .limit(1);

    if (!existingPolicies || existingPolicies.length === 0) {
      await supabase.from("company_policies").insert([
        {
          title: "Remote Work Policy",
          content: `## Remote Work Guidelines

### Eligibility
All full-time employees who have completed their probation period are eligible for remote work.

### Schedule
- Employees can work remotely up to 3 days per week
- Core hours (10 AM - 4 PM) must be maintained for meetings
- Manager approval required for fully remote arrangements

### Equipment
- Company provides laptop and essential equipment
- Internet stipend of $50/month for remote workers

### Communication
- Daily standup attendance required
- Slack/Teams response within 2 hours during work hours
- Camera-on policy for key meetings`,
          category: "remote",
          is_active: true,
        },
        {
          title: "Annual Leave Policy",
          content: `## Annual Leave Guidelines

### Entitlement
- Full-time employees: 20 days per year
- Part-time employees: Pro-rata calculation
- Unused leave: Up to 5 days can be carried forward

### Requesting Leave
- Submit request at least 2 weeks in advance
- Manager approval required
- Emergency leave: Contact HR immediately

### Blackout Periods
- Year-end closing (Dec 20 - Jan 5)
- Quarterly closing (last week of each quarter)

### Public Holidays
- All national holidays observed
- Additional floating holiday available`,
          category: "leave",
          is_active: true,
        },
        {
          title: "Code of Conduct",
          content: `## Professional Code of Conduct

### Core Values
- **Integrity**: Act honestly and ethically
- **Respect**: Treat colleagues with dignity
- **Excellence**: Strive for quality in all work
- **Collaboration**: Work together effectively

### Workplace Behavior
- No harassment or discrimination
- Maintain confidentiality
- Report conflicts of interest
- Follow security protocols

### Dress Code
- Business casual in office
- Professional attire for client meetings

### Violations
- First offense: Written warning
- Second offense: Performance improvement plan
- Severe violations: Immediate termination`,
          category: "conduct",
          is_active: true,
        },
      ]);
    }

    // Add some sample tasks for the employee
    const employeeUser = results.find((r) => r.email === "employee@test.com" && r.userId);
    const managerUser = results.find((r) => r.email === "manager@test.com" && r.userId);

    if (employeeUser?.userId) {
      const { data: existingTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("assigned_to", employeeUser.userId)
        .limit(1);

      if (!existingTasks || existingTasks.length === 0) {
        await supabase.from("tasks").insert([
          {
            title: "Complete Q4 Performance Review",
            description: "Fill out self-assessment form and schedule meeting with manager",
            assigned_to: employeeUser.userId,
            created_by: managerUser?.userId || employeeUser.userId,
            status: "pending",
            priority: "high",
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            title: "Update project documentation",
            description: "Review and update README files for all active projects",
            assigned_to: employeeUser.userId,
            created_by: managerUser?.userId || employeeUser.userId,
            status: "in_progress",
            priority: "medium",
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            title: "Team training session",
            description: "Attend the new security protocols training",
            assigned_to: employeeUser.userId,
            created_by: managerUser?.userId || employeeUser.userId,
            status: "pending",
            priority: "low",
            due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo data seeded successfully",
        users: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error seeding data:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
