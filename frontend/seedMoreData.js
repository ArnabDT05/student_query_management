import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const genericTickets = [
  ["Scholarship disbursement delayed", "The state scholarship amount hasn't credited to my SBI account yet. It's been 3 weeks."],
  ["ID Card lost in transit", "I lost my ID card in the university canteen, I need to apply for a duplicate."],
  ["Project submission extension", "Requesting a 2-day extension for the final year major project report."],
  ["Lab equipment faulty", "The digital oscilloscope in Lab 3 is completely out of calibration."],
  ["Transport bus pass renewal", "Bus pass for Route 4 needs immediate renewal for the upcoming semester."],
  ["Attendance discrepancy", "My attendance for DBMS shows 60% but I attended all lectures. Please verify with the professor."],
  ["Bonafide certificate for passport", "Need an authorized bonafide certificate to apply for police passport verification."],
  ["Hostel room change request", "Due to severe water leakage in room 302, please shift me to another block."],
  ["WiFi disconnecting frequently", "The 'Univ-Secure' wifi keeps disconnecting in the central library reading room."],
  ["Alumni portal access", "I'm graduating this semester, how do I get alumni portal lifetime access credentials?"],
  ["Elective subject change", "Want to switch from Machine Learning to Cloud Computing elective before the deadline."],
  ["Convocation dress code", "What is the exact dress code and gown color for the upcoming convocation ceremony?"],
  ["Sports complex membership", "How to apply for the indoor gym and swimming pool membership?"],
  ["Medical reimbursement", "Submitting hospital bills for a medical emergency as per the university health scheme."],
  ["Software license request", "Need a MATLAB standalone student license key for my M.Tech thesis work."],
  ["Classroom AC not working", "The AC in lecture hall 4 is blowing warm air and the projector screen is stuck."],
  ["Duplicate marksheet required", "Need a duplicate marksheet for semester 2, the original got damaged in the rain."],
  ["Plagiarism checker access", "Need Turnitin login access to check my IEEE research paper before submission."],
  ["Guest house booking request", "Need to book an AC guest house room for my parents visiting next week."],
  ["Fee receipt generation error", "Paid semester fee via NEFT but the portal shows transaction failed while bank deducted the money."]
];

async function seedMore() {
  const ts = Date.now();
  console.log("=========================================");
  console.log("   🚀 GENERATING 20 DEMO TICKETS         ");
  console.log("=========================================");

  console.log("1. Authenticating as Admin to fetch User catalog...");
  await supabase.auth.signInWithPassword({ email: 'test3@university.edu', password: '12345678' });
  const { data: categories } = await supabase.from('categories').select('id, department');
  
  if (!categories?.length) {
    console.error("No categories found! Please run original seedData.js first."); return;
  }
  
  console.log("2. Generating Volume Accounts natively in memory...");
  const students = [];
  for (let i = 1; i <= 4; i++) {
    const email = `bulk.student${i}_${ts}@university.edu`;
    const { data } = await supabase.auth.signUp({ 
        email, password: 'password123', 
        options: { data: { name: `Demo Student ${i}`, role: 'student' } } 
    });
    if (data?.user) students.push({ id: data.user.id, email });
  }
  
  const staff = [];
  for (let i = 1; i <= 3; i++) {
    const email = `bulk.staff${i}_${ts}@university.edu`;
    const { data } = await supabase.auth.signUp({ 
        email, password: 'password123', 
        options: { data: { name: `Demo Staff ${i}`, role: 'staff' } } 
    });
    if (data?.user) staff.push({ id: data.user.id, email });
  }
  
  console.log(`   ✅ Generated ${students.length} Students and ${staff.length} Staff.`);
  
  // Await triggers
  await new Promise(r => setTimeout(r, 2000));
  
  const statuses = ['open', 'in_progress', 'closed', 'escalated'];
  const priorities = ['low', 'medium', 'high'];
  
  console.log("\n3. Looping 20 tickets and pushing to DB under Dynamic Student Auth Contexts...");
  
  let inserted = 0;
  for (let i = 0; i < 20; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // 70% chance to be assigned to staff
    let assignedStaff = null;
    if (Math.random() > 0.3 && staff.length > 0) {
       assignedStaff = staff[Math.floor(Math.random() * staff.length)].id;
    }
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const [title, description] = genericTickets[i];
    
    let createdAt = new Date();
    if (status === 'escalated') {
       createdAt = new Date(Date.now() - (25 + Math.random() * 50) * 60 * 60 * 1000); 
    } else if (status === 'closed') {
       createdAt = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000); 
    } else {
       createdAt = new Date(Date.now() - Math.random() * 20 * 60 * 60 * 1000); 
    }
    
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: student.email, password: 'password123' });
    if (authErr) {
       console.log("   ❌ Skipping student (auth failed):", student.email);
       continue;
    }
    
    const { error: insertErr } = await supabase.from('tickets').insert({
       title,
       description,
       category_id: category.id,
       priority,
       student_id: student.id,
       assigned_to: assignedStaff,
       status,
       created_at: createdAt.toISOString()
    });
    
    if (!insertErr) {
        inserted++;
        console.log(`   ✅ Inserted ticket ${i+1}/20: [${status.toUpperCase()}] ${title}`);
    } else {
        console.error(`   ❌ Failed to insert ticket ${i+1}:`, insertErr.message);
    }
  }
  
  console.log("\n=========================================");
  console.log(`   ✅ SUCCESSFULLY SEEDED ${inserted} VOLUME METRICS!`);
  console.log("=========================================\n");
}

seedMore().catch(console.error);
