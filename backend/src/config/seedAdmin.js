import bcrypt from 'bcryptjs';
import supabase from './supabase.js';

/**
 * Tự động tạo tài khoản Admin khi backend khởi động.
 * - Nếu user với ADMIN_EMAIL đã tồn tại → bỏ qua (dù role là gì).
 * - Nếu chưa tồn tại → tạo mới với role = 'admin'.
 * - Mọi thông tin lấy từ biến môi trường ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD.
 */
const seedAdmin = async () => {
  const email    = process.env.ADMIN_EMAIL;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !username || !password) {
    console.warn('⚠️  Chưa cấu hình ADMIN_EMAIL / ADMIN_USERNAME / ADMIN_PASSWORD trong .env — bỏ qua seed admin.');
    return;
  }

  try {
    // Kiểm tra tồn tại theo email
    const { data: existing, error: findErr } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (findErr) throw findErr;

    if (existing) {
      // Đã tồn tại — đảm bảo role là admin (phòng trường hợp đã tạo tay nhưng quên set role)
      if (existing.role !== 'admin') {
        await supabase.from('users').update({ role: 'admin' }).eq('id', existing.id);
        console.log(`🔧 Đã cập nhật role → admin cho tài khoản ${email}`);
      } else {
        console.log(`✅ Tài khoản admin "${email}" đã tồn tại — bỏ qua.`);
      }
      return;
    }

    // Chưa tồn tại → tạo mới
    const hashedPassword = await bcrypt.hash(password, 12);

    const { error: insertErr } = await supabase.from('users').insert({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      is_character_created: true,   // admin không cần setup nhân vật
      spirit_root: 'Hỗn Nguyên',
      spirit_root_grade: 'Thiên',
      gender: 'male',
      spirit_stones: 999999999,
    });

    if (insertErr) throw insertErr;

    console.log(`🛡️  Đã tạo tài khoản Admin mặc định:`);
    console.log(`     Email   : ${email}`);
    console.log(`     Username: ${username}`);
    console.log(`     Password: ${password}`);
    console.log(`   ⚠️  Hãy đổi mật khẩu sau lần đăng nhập đầu tiên!`);
  } catch (err) {
    console.error('❌ Lỗi khi seed admin:', err.message);
    // Không exit — lỗi seed admin không nên dừng server
  }
};

export default seedAdmin;
