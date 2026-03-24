import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function seed() {
  console.log("=========================================");
  console.log("   🚀 STARTING SUPABASE DEMO SEEDING     ");
  console.log("=========================================");
  
  const ts = Date.now();
  
  // 1. ADMIN - Auth to insert categories
  console.log("\n[1/5] Authenticating as Global Admin...");
  const { data: adminAuth, error: adminErr } = await supabase.auth.signInWithPassword({ 
    email: 'test3@university.edu', 
    password: '12345678' 
  });
  
  if (adminErr) throw new Error("Could not log in as test3@university.edu Admin!");

  console.log("[2/5] Creating University Departments & Categories...");
  const categoriesToInsert = [
    { name: 'Semester Fee Status', department: 'Finance' },
    { name: 'Hostel WiFi Issue', department: 'IT Support' },
    { name: 'Course Add/Drop', department: 'Academic' }
  ];
  
  const { data: catData, error: catErr } = await supabase
    .from('categories')
    .insert(categoriesToInsert)
    .select();
    
  if (catErr) console.warn("Categories might already exist, ignoring:", catErr.message);
  
  // We need to fetch universally in case they existed
  const { data: allCats } = await supabase.from('categories').select('*');
  const financeCat = allCats.find(c => c.department === 'Finance')?.id;
  const itCat = allCats.find(c => c.department === 'IT Support')?.id;
  const acadCat = allCats.find(c => c.department === 'Academic')?.id;

  // 2. Register Staff Users
  console.log("\n[3/5] Registering 2 Indian Staff Members...");
  const staff1 = `priya.sharma_${ts}@university.edu`;
  const { data: s1 } = await supabase.auth.signUp({ 
    email: staff1, password: 'password123', 
    options: { data: { name: 'Priya Sharma', role: 'staff', department: 'IT Support' } } 
  });
  
  const staff2 = `vikram.singh_${ts}@university.edu`;
  const { data: s2 } = await supabase.auth.signUp({ 
    email: staff2, password: 'password123', 
    options: { data: { name: 'Vikram Singh', role: 'staff', department: 'Finance' } } 
  });
  
  console.log("      ✅ Staff Priya Sharma (IT Support) created.");
  console.log("      ✅ Staff Vikram Singh (Finance) created.");

  // 3. Register Students & Generate Tickets
  console.log("\n[4/5] Registering 3 Indian Students and routing their tickets...");
  
  // STUDENT 1
  const stu1 = `rahul.desai_${ts}@university.edu`;
  const { data: u1 } = await supabase.auth.signUp({
    email: stu1, password: 'password123',
    options: { data: { name: 'Rahul Desai', role: 'student' } }
  });
  
  await delay(1500); // Wait for postgres triggers to sync the auth user
  
  const { data: t1 } = await supabase.from('tickets').insert({
    title: "Hostel Block B WiFi is completely down",
    description: "Since yesterday night, the wifi router connecting Block B 3rd floor is blinking red and not authenticating MAC addresses.",
    category_id: itCat,
    priority: "high",
    student_id: u1.user.id,
    assigned_to: s1.user.id,
    status: "open"
  }).select().single();
  
  const { data: t2 } = await supabase.from('tickets').insert({
    title: "Semester 4 tuition fee receipt not generated",
    description: "I paid the fee via Axis Bank UPI but the official portal has not generated the PDF receipt.",
    category_id: financeCat,
    priority: "medium",
    student_id: u1.user.id,
    assigned_to: s2.user.id,
    status: "in_progress"
  }).select().single();

  // STUDENT 2
  const stu2 = `sneha.patel_${ts}@university.edu`;
  const { data: u2 } = await supabase.auth.signUp({
    email: stu2, password: 'password123',
    options: { data: { name: 'Sneha Patel', role: 'student' } }
  });
  
  await delay(1000);
  
  const { data: t3 } = await supabase.from('tickets').insert({
    title: "MAC address whitelisting for new laptop",
    description: "I bought a new MacBook Air. Please whitelist the MAC address AB:CD:EF:12:34:56.",
    category_id: itCat,
    priority: "low",
    student_id: u2.user.id,
    assigned_to: s1.user.id,
    status: "closed"
  }).select().single();
  
  const { data: t4 } = await supabase.from('tickets').insert({
    title: "Education Loan document signature",
    description: "I need the bonafide certificate signed and stamped by the finance officer ASAP for my SBI loan disbursement.",
    category_id: financeCat,
    priority: "high",
    student_id: u2.user.id,
    assigned_to: s2.user.id,
    status: "escalated",
    // Set timestamp purely backwards to simulate SLA breach
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() 
  }).select().single();

  // STUDENT 3
  const stu3 = `arjun.reddy_${ts}@university.edu`;
  const { data: u3 } = await supabase.auth.signUp({
    email: stu3, password: 'password123',
    options: { data: { name: 'Arjun Reddy', role: 'student' } }
  });
  
  await delay(1000);
  
  const { data: t5 } = await supabase.from('tickets').insert({
    title: "Course Add/Drop for Advanced DBMS",
    description: "The portal is not allowing me to select Advanced DBMS even though I have completed the prerequisites.",
    category_id: acadCat,
    priority: "medium",
    student_id: u3.user.id,
    status: "open" // Unassigned queue ticket
  }).select().single();

  console.log("      ✅ Created 5 unique tickets across Open, In Progress, Escalated, and Closed statuses.");

  // 4. Staff Responses
  console.log("\n[5/5] Submitting Staff Responses to ticket threads...");
  
  await supabase.auth.signInWithPassword({ email: staff1, password: 'password123' });
  await supabase.from('responses').insert([
    { ticket_id: t1.id, sender_id: s1.user.id, message: "Hi Rahul, we are dispatching a network technician to Block B right now. Should be fixed in 2 hours." },
    { ticket_id: t3.id, sender_id: s1.user.id, message: "MAC address has been added to the radius server. Please ensure you select the 'Univ-Secure' SSID." }
  ]);

  await supabase.auth.signInWithPassword({ email: staff2, password: 'password123' });
  await supabase.from('responses').insert([
    { ticket_id: t2.id, sender_id: s2.user.id, message: "Hi Rahul, we have verified the UPI UTR number manually. The receipt will be mailed to you by EOD." },
    { ticket_id: t4.id, sender_id: s2.user.id, message: "Sneha, this requires the Registrar's signature as well. I am escalating this to the head of finance." }
  ]);
  
  // One student response back
  await supabase.auth.signInWithPassword({ email: stu1, password: 'password123' });
  await supabase.from('responses').insert([
    { ticket_id: t2.id, sender_id: u1.user.id, message: "Thank you Vikram sir. I'll check my mail this evening." }
  ]);

  console.log("\n=========================================");
  console.log("   ✅ SEEDING COMPLETE! ");
  console.log("   Loaded Indian University Demo Data");
  console.log("=========================================\n");
  
  console.log("Test Accounts Generated (Password: password123):");
  console.log(`- Staff (Finance): ${staff2}`);
  console.log(`- Staff (IT): ${staff1}`);
  console.log(`- Student (With activity): ${stu1}`);
  console.log(`- Student (With escalated ticket): ${stu2}`);
}

seed().catch(console.error);
