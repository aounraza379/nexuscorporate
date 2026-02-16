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
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const testUsers = [
      { email: "hr@test.com", password: "password123", fullName: "Priya Sharma", role: "hr", department: "Human Resources" },
      { email: "manager@test.com", password: "password123", fullName: "Rahul Kapoor", role: "manager", department: "Engineering" },
      { email: "employee@test.com", password: "password123", fullName: "Ananya Patel", role: "employee", department: "Engineering" },
      { email: "employee2@test.com", password: "password123", fullName: "Vikram Singh", role: "employee", department: "Engineering" },
      { email: "employee3@test.com", password: "password123", fullName: "Neha Gupta", role: "employee", department: "Design" },
      { email: "employee4@test.com", password: "password123", fullName: "Arjun Reddy", role: "employee", department: "Marketing" },
      { email: "employee5@test.com", password: "password123", fullName: "Kavya Nair", role: "employee", department: "Engineering" },
      { email: "manager2@test.com", password: "password123", fullName: "Deepa Iyer", role: "manager", department: "Design" },
    ];

    const userMap: Record<string, string> = {};
    const results = [];

    for (const user of testUsers) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u) => u.email === user.email);

      if (existing) {
        userMap[user.email] = existing.id;
        // Update profile with department
        await supabase.from("profiles").update({ department: user.department, full_name: user.fullName }).eq("id", existing.id);
        results.push({ email: user.email, status: "already exists", userId: existing.id });
        continue;
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.fullName, role: user.role },
      });

      if (error) {
        results.push({ email: user.email, status: "error", error: error.message });
      } else {
        userMap[user.email] = data.user!.id;
        await supabase.from("profiles").update({ department: user.department }).eq("id", data.user!.id);
        results.push({ email: user.email, status: "created", userId: data.user!.id });
      }
    }

    const hrId = userMap["hr@test.com"];
    const managerId = userMap["manager@test.com"];
    const emp1 = userMap["employee@test.com"];
    const emp2 = userMap["employee2@test.com"];
    const emp3 = userMap["employee3@test.com"];
    const emp4 = userMap["employee4@test.com"];
    const emp5 = userMap["employee5@test.com"];

    // ---- COMPANY POLICIES ----
    const { data: existingPolicies } = await supabase.from("company_policies").select("id").limit(1);
    if (!existingPolicies || existingPolicies.length === 0) {
      await supabase.from("company_policies").insert([
        {
          title: "Remote Work Policy",
          content: `## Remote Work Guidelines\n\n### Eligibility\nAll full-time employees who have completed their probation period are eligible for remote work.\n\n### Schedule\n- Employees can work remotely up to 3 days per week\n- Core hours (10 AM - 4 PM) must be maintained for meetings\n- Manager approval required for fully remote arrangements\n\n### Equipment\n- Company provides laptop and essential equipment\n- Internet stipend of ₹2,000/month for remote workers\n\n### Communication\n- Daily standup attendance required\n- Slack/Teams response within 2 hours during work hours\n- Camera-on policy for key meetings`,
          category: "remote", is_active: true, created_by: hrId,
        },
        {
          title: "Annual Leave Policy",
          content: `## Annual Leave Guidelines\n\n### Entitlement\n- Full-time employees: 20 days per year\n- Part-time employees: Pro-rata calculation\n- Unused leave: Up to 5 days can be carried forward\n\n### Requesting Leave\n- Submit request at least 2 weeks in advance\n- Manager approval required\n- Emergency leave: Contact HR immediately\n\n### Blackout Periods\n- Year-end closing (Dec 20 - Jan 5)\n- Quarterly closing (last week of each quarter)`,
          category: "leave", is_active: true, created_by: hrId,
        },
        {
          title: "Code of Conduct",
          content: `## Professional Code of Conduct\n\n### Core Values\n- **Integrity**: Act honestly and ethically\n- **Respect**: Treat colleagues with dignity\n- **Excellence**: Strive for quality in all work\n- **Collaboration**: Work together effectively\n\n### Workplace Behavior\n- No harassment or discrimination\n- Maintain confidentiality\n- Report conflicts of interest\n- Follow security protocols\n\n### Violations\n- First offense: Written warning\n- Second offense: Performance improvement plan\n- Severe violations: Immediate termination`,
          category: "conduct", is_active: true, created_by: hrId,
        },
      ]);
    }

    // ---- TASKS ----
    const { data: existingTasks } = await supabase.from("tasks").select("id").limit(1);
    if (!existingTasks || existingTasks.length === 0) {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      await supabase.from("tasks").insert([
        { title: "Complete Q4 Performance Review", description: "Fill out self-assessment form and schedule meeting with manager", assigned_to: emp1, created_by: managerId, status: "pending", priority: "high", due_date: new Date(now + 3 * day).toISOString() },
        { title: "Update project documentation", description: "Review and update README files for all active projects", assigned_to: emp1, created_by: managerId, status: "in_progress", priority: "medium", due_date: new Date(now + 10 * day).toISOString() },
        { title: "Security training certification", description: "Complete annual cybersecurity awareness training module", assigned_to: emp1, created_by: hrId, status: "pending", priority: "high", due_date: new Date(now + 5 * day).toISOString() },
        { title: "Code review for auth module", description: "Review the new authentication module pull request", assigned_to: emp2, created_by: managerId, status: "pending", priority: "high", due_date: new Date(now + 2 * day).toISOString() },
        { title: "Write unit tests for payments", description: "Add test coverage for payment processing endpoints", assigned_to: emp2, created_by: managerId, status: "in_progress", priority: "medium", due_date: new Date(now + 7 * day).toISOString() },
        { title: "Design new landing page", description: "Create mockups for the new product landing page", assigned_to: emp3, created_by: userMap["manager2@test.com"], status: "pending", priority: "high", due_date: new Date(now + 4 * day).toISOString() },
        { title: "Q1 marketing campaign plan", description: "Draft the Q1 digital marketing campaign strategy", assigned_to: emp4, created_by: managerId, status: "pending", priority: "medium", due_date: new Date(now + 14 * day).toISOString() },
        { title: "API optimization sprint", description: "Optimize database queries in the reporting API", assigned_to: emp5, created_by: managerId, status: "in_progress", priority: "high", due_date: new Date(now + 6 * day).toISOString() },
        { title: "Onboarding document updates", description: "Update employee onboarding checklist and handbook", assigned_to: hrId, created_by: hrId, status: "pending", priority: "medium", due_date: new Date(now + 12 * day).toISOString() },
        { title: "Team retrospective preparation", description: "Prepare agenda and data for bi-weekly team retro", assigned_to: managerId, created_by: managerId, status: "pending", priority: "low", due_date: new Date(now + 1 * day).toISOString() },
      ]);
    }

    // ---- LEAVE REQUESTS ----
    const { data: existingLeaves } = await supabase.from("leave_requests").select("id").limit(1);
    if (!existingLeaves || existingLeaves.length === 0) {
      await supabase.from("leave_requests").insert([
        { user_id: emp1, leave_type: "annual", start_date: "2026-02-24", end_date: "2026-02-26", status: "pending", reason: "Family wedding" },
        { user_id: emp2, leave_type: "sick", start_date: "2026-02-18", end_date: "2026-02-19", status: "pending", reason: "Doctor appointment" },
        { user_id: emp3, leave_type: "personal", start_date: "2026-02-20", end_date: "2026-02-20", status: "approved", reason: "Personal errand", reviewed_by: userMap["manager2@test.com"] },
        { user_id: emp4, leave_type: "annual", start_date: "2026-03-01", end_date: "2026-03-05", status: "pending", reason: "Vacation" },
        { user_id: emp5, leave_type: "sick", start_date: "2026-02-17", end_date: "2026-02-17", status: "approved", reason: "Not feeling well", reviewed_by: managerId },
        { user_id: emp1, leave_type: "annual", start_date: "2026-01-10", end_date: "2026-01-12", status: "approved", reason: "Trip", reviewed_by: managerId },
      ]);
    }

    // ---- ANNOUNCEMENTS (including mandatory) ----
    const { data: existingAnnouncements } = await supabase.from("announcements").select("id").limit(1);
    if (!existingAnnouncements || existingAnnouncements.length === 0) {
      await supabase.from("announcements").insert([
        {
          title: "Mandatory: Data Protection Policy Update",
          content: `Following the new data protection regulations effective March 1st 2026, all employees are required to complete the updated Data Protection Compliance training. The training covers the handling of personal identifiable information (PII), new encryption standards for data at rest and in transit, updated breach notification procedures, third-party data sharing guidelines, and employee responsibilities under the updated framework. All employees must complete this training by February 28th 2026. Failure to comply may result in restricted access to company systems. The training module is available on the Learning Management System under "Compliance > Data Protection 2026". Each employee must score at least 80% on the assessment to pass. HR will track completion status and send reminders. If you have questions, contact the IT Security team at security@company.com or reach out to your department head. This is a regulatory requirement and non-compliance could result in penalties for both the individual and the organization. Please prioritize this training immediately.`,
          priority: "urgent", is_mandatory: true, created_by: hrId,
        },
        {
          title: "Mandatory: Updated Work-from-Home Agreement",
          content: `All remote and hybrid employees must review and sign the updated Work-from-Home Agreement by March 15th 2026. The updated agreement includes new provisions for home office safety standards, equipment liability, data security requirements while working remotely, and updated expectations for availability during core business hours. The agreement also introduces a quarterly self-assessment for remote workspace compliance. Employees who fail to sign the updated agreement by the deadline will have their remote work privileges temporarily suspended until compliance is achieved. Please download the agreement from the HR portal, review it carefully, sign electronically, and submit through the Document Management System. For questions about specific clauses or accommodations, schedule a meeting with your HR Business Partner. This is mandatory for all employees currently on remote or hybrid work arrangements.`,
          priority: "important", is_mandatory: true, created_by: hrId,
        },
        {
          title: "Office Renovation - Floor 3",
          content: "Floor 3 will undergo renovation from March 10-24. Teams on Floor 3 will be temporarily relocated to Floor 5. Please pack your personal items by March 9th.",
          priority: "normal", is_mandatory: false, created_by: managerId,
        },
        {
          title: "Quarterly Town Hall - March 5th",
          content: "Join us for the Q1 Town Hall on March 5th at 3 PM. CEO will share company updates, financials, and roadmap. Submit your questions via the anonymous form.",
          priority: "important", is_mandatory: false, created_by: hrId,
        },
        {
          title: "New Health Insurance Plans Available",
          content: "We've partnered with MedCare Plus to offer enhanced health insurance tiers. Open enrollment starts March 1st. Check with HR for plan comparisons.",
          priority: "normal", is_mandatory: false, created_by: hrId,
        },
      ]);
    }

    // ---- EMPLOYEE BENEFITS ----
    const { data: existingBenefits } = await supabase.from("employee_benefits").select("id").limit(1);
    if (!existingBenefits || existingBenefits.length === 0) {
      await supabase.from("employee_benefits").insert([
        {
          user_id: emp1, insurance_tier: "premium", total_limit: 500000, amount_spent: 75000,
          plan_start_date: "2026-01-01", plan_end_date: "2026-12-31",
          coverage_details: { hospitalization: true, outpatient: true, dental: true, vision: true, maternity: true, mental_health: true, annual_checkup: true, max_room_rent: 10000 },
          dependents: [{ name: "Raj Patel", relationship: "Spouse", dob: "1995-08-15" }, { name: "Aarav Patel", relationship: "Child", dob: "2022-03-10" }],
        },
        {
          user_id: emp2, insurance_tier: "standard", total_limit: 300000, amount_spent: 42000,
          plan_start_date: "2026-01-01", plan_end_date: "2026-12-31",
          coverage_details: { hospitalization: true, outpatient: true, dental: true, vision: false, maternity: false, mental_health: true, annual_checkup: true, max_room_rent: 7500 },
          dependents: [{ name: "Meera Singh", relationship: "Spouse", dob: "1993-11-22" }],
        },
        {
          user_id: emp3, insurance_tier: "basic", total_limit: 100000, amount_spent: 12000,
          plan_start_date: "2026-01-01", plan_end_date: "2026-12-31",
          coverage_details: { hospitalization: true, outpatient: false, dental: false, vision: false, maternity: false, mental_health: false, annual_checkup: true, max_room_rent: 5000 },
          dependents: [],
        },
        {
          user_id: emp4, insurance_tier: "standard", total_limit: 300000, amount_spent: 0,
          plan_start_date: "2026-01-01", plan_end_date: "2026-12-31",
          coverage_details: { hospitalization: true, outpatient: true, dental: true, vision: false, maternity: false, mental_health: true, annual_checkup: true, max_room_rent: 7500 },
          dependents: [],
        },
        {
          user_id: emp5, insurance_tier: "premium", total_limit: 500000, amount_spent: 125000,
          plan_start_date: "2026-01-01", plan_end_date: "2026-12-31",
          coverage_details: { hospitalization: true, outpatient: true, dental: true, vision: true, maternity: true, mental_health: true, annual_checkup: true, max_room_rent: 10000 },
          dependents: [{ name: "Sita Nair", relationship: "Spouse", dob: "1994-06-30" }, { name: "Arun Nair", relationship: "Child", dob: "2020-12-01" }, { name: "Priti Nair", relationship: "Child", dob: "2023-07-18" }],
        },
      ]);
    }

    // ---- WELLNESS CHECKINS ----
    const { data: existingWellness } = await supabase.from("wellness_checkins").select("id").limit(1);
    if (!existingWellness || existingWellness.length === 0) {
      await supabase.from("wellness_checkins").insert([
        { user_id: emp1, mood: 4, energy: 3, stress: 2, notes: "Feeling productive today" },
        { user_id: emp2, mood: 3, energy: 2, stress: 4, notes: "Tight deadlines this week" },
        { user_id: emp3, mood: 5, energy: 5, stress: 1, notes: "Great day!" },
        { user_id: emp5, mood: 2, energy: 2, stress: 5, notes: "Overwhelmed with sprint tasks" },
      ]);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Comprehensive demo data seeded", users: results }),
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
