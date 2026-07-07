import supabase from './supabase.js';

const connectDB = async () => {
  try {
    // Test kết nối Supabase bằng cách query 1 bản ghi từ users
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
  } catch (error) {
    console.error(`❌ Supabase connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
