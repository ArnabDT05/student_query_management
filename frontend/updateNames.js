import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const indianStudentNames = ["Aarav Patel", "Nisha Sharma", "Rohan Gupta", "Priya Desai", "Kabir Singh", "Anjali Mehta", "Vikram Reddy"];
const indianStaffNames = ["Suresh Menon", "Kavita Rao", "Rajit Khanna", "Meera Iyer", "Anil Deshmukh"];

async function run() {
  console.log("Authenticating Admin permissions to bypass normal read restrictions...");
  await supabase.auth.signInWithPassword({ email: 'test3@university.edu', password: '12345678' });
  
  console.log("Fetching Demo Students...");
  const { data: students } = await supabase.from('users').select('id').eq('role', 'student').like('name', 'Demo Student%');
  
  if (students && students.length > 0) {
    for (let i = 0; i < students.length; i++) {
      await supabase.from('users').update({ name: indianStudentNames[i % indianStudentNames.length] }).eq('id', students[i].id);
      console.log(`✅ Updated Student metadata to: ${indianStudentNames[i % indianStudentNames.length]}`);
    }
  } else {
    console.log("No 'Demo Student' names tracked.");
  }

  console.log("\nFetching Demo Staff...");
  const { data: staff } = await supabase.from('users').select('id').eq('role', 'staff').like('name', 'Demo Staff%');
  
  if (staff && staff.length > 0) {
    for (let i = 0; i < staff.length; i++) {
      await supabase.from('users').update({ name: indianStaffNames[i % indianStaffNames.length] }).eq('id', staff[i].id);
      console.log(`✅ Updated Staff metadata to: ${indianStaffNames[i % indianStaffNames.length]}`);
    }
  } else {
    console.log("No 'Demo Staff' names tracked.");
  }
  
  console.log("\nSuccessfully completed metadata string overwrites!");
}

run().catch(console.error);
