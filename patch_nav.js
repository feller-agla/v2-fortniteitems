const fs = require('fs');
let code = fs.readFileSync('app/components/Navbar.jsx', 'utf8');
code = code.replace(/import \{ useCart \} from "\.\.\/context\/CartContext";\n/g, '');
code = code.replace(/const \{ cartCount \} = useCart\(\);\n/g, '');
// Remove the whole block for the cart icon
code = code.replace(/<Link \n\s*href="\/cart"[\s\S]*?<\/Link>/g, '');
fs.writeFileSync('app/components/Navbar.jsx', code);
