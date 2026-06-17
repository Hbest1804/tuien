import { Flame, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full relative bg-surface-container-lowest border-t border-primary/10 z-10 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb-gold w-72 h-72 -bottom-20 -left-20 opacity-30" />
        <div className="orb-jade w-56 h-56 -bottom-10 right-0 opacity-20" />
      </div>

      {/* Top mystical divider */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center gold-glow">
                <Flame size={18} className="text-primary" />
              </div>
              <span className="font-headline-md text-[18px] gradient-text-gold tracking-widest uppercase">Linh Thư</span>
            </div>
            <p className="font-body-md text-on-surface-variant/70 text-sm leading-relaxed">
              Tiên giới nơi tu luyện và phát triển. Chinh phục vạn dặm trường sinh bất lão cùng hàng ngàn tu sĩ.
            </p>
            <div className="flex gap-3 mt-5">
              {[Github, Twitter, Mail].map((Icon, i) => (
                <button
                  key={i}
                  className="w-8 h-8 rounded-lg border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all duration-300 hover:bg-primary/5"
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-label-caps text-primary text-[10px] mb-4 tracking-[0.2em]">Khám Phá</h3>
            <ul className="space-y-2.5">
              {['Tông Đỉnh', 'Bản Đồ Thế Giới', 'Linh Căn', 'Tàng Kinh Các'].map((link) => (
                <li key={link}>
                  <a href="#" className="font-body-md text-on-surface-variant/70 text-sm hover:text-primary transition-colors duration-200 flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-label-caps text-primary text-[10px] mb-4 tracking-[0.2em]">Điều Khoản</h3>
            <ul className="space-y-2.5">
              {['Nội Quy Tông Môn', 'Thiên Đạo Quy Tắc', 'Hỗ Trợ Tu Sĩ', 'Ghi Công Pháp'].map((link) => (
                <li key={link}>
                  <a href="#" className="font-body-md text-on-surface-variant/70 text-sm hover:text-primary transition-colors duration-200 flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-body-md text-on-surface-variant/50 text-xs">
            © 2024 Linh Thư · Thiên Đạo. Bản quyền được bảo hộ.
          </p>
          <p className="font-label-caps text-on-surface-variant/30 text-[10px] tracking-widest">
            Nguyện linh khí của ngươi vĩnh cửu bất diệt ✦
          </p>
        </div>
      </div>
    </footer>
  );
}
