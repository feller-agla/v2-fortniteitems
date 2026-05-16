const fs = require('fs');
let code = fs.readFileSync('app/components/ShopItem.jsx', 'utf8');

// Replace the handleAdd and addToCart usage
code = code.replace(/const handleAdd = \(\) => \{\n\s*addToCart\([^)]+\)\n?;\n\s*\};/g, 'const paymentUrl = getPaymentLink(vbucks);');

// Replace the ADD TO CART button with two buttons
const oldButtons = `<button 
          onClick={handleAdd}
          className="btn-fortnite bg-white/10 hover:bg-white text-white hover:text-fortnite-blue w-full py-2 sm:py-2.5 mt-2 shadow-[0_4px_0_rgba(0,0,0,0.4)] transition-colors border border-white/20 hover:border-white"
        >
          <span className="btn-fortnite-inner text-xs sm:text-sm font-semibold leading-none mt-1">AJOUTER</span>
        </button>`;

const newButtons = `<div className="w-full flex gap-2 mt-2">
          <Link href={paymentUrl} target="_blank" className="btn-fortnite bg-fortnite-yellow text-black hover:bg-white w-2/3 py-2 sm:py-2.5 shadow-[0_4px_0_rgba(200,200,0,0.8)] transition-all transform hover:-translate-y-1">
            <span className="btn-fortnite-inner text-xs sm:text-sm font-bold leading-none mt-1">ACHETER</span>
          </Link>
          <Link href={\`/shop/\${id}\`} className="btn-fortnite bg-white/10 text-white hover:bg-white hover:text-fortnite-blue w-1/3 py-2 sm:py-2.5 shadow-[0_4px_0_rgba(0,0,0,0.4)] transition-all border border-white/20 hover:border-white">
            <span className="btn-fortnite-inner text-xs sm:text-sm font-semibold leading-none mt-1">PLUS</span>
          </Link>
        </div>`;

code = code.replace(oldButtons, newButtons);

// Remove useCart import and usages
code = code.replace(/import \{ useCart \} from "\.\.\/context\/CartContext";\n/g, '');
code = code.replace(/const \{ addToCart, isDiscounted \} = useCart\(\);\n\s*/g, 'const isDiscounted = false;\n  ');

fs.writeFileSync('app/components/ShopItem.jsx', code);
