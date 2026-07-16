import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 pt-8 pb-10 mt-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h2 className="text-2xl font-black text-green-400 mb-3">Malik.XGO</h2>
            <p className="text-zinc-500">Premium gaming platform with fast deposits, instant withdrawals.</p>
          </div>
          
          <div>
            <h3 className="font-black mb-4">Games</h3>
            <div className="space-y-2 text-zinc-400">
              <p>Color Trade</p>
              <p>Mines</p>
              <p>Sky Aviator</p>
              <p>Spin Wheel</p>
              <p>Plinko</p>
              <p>Lottery</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-black mb-4">Support</h3>
            <div className="space-y-2 text-zinc-400">
              <p>Help Center</p>
              <p>Contact Us</p>
              <p>FAQ</p>
              <p>Live Chat</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-black mb-4">Legal</h3>
            <div className="space-y-2 text-zinc-400">
              <Link href="/terms" className="hover:text-green-400 transition">Terms & Conditions</Link>
              <br />
              <Link href="/privacy" className="hover:text-green-400 transition">Privacy Policy</Link>
              <p>Responsible Gaming</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-zinc-500">
          © 2026 Malik.XGO — All Rights Reserved
        </div>
      </div>
    </footer>
  );
}