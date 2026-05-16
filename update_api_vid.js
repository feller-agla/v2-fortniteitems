const fs = require('fs');
const content = fs.readFileSync('app/api/shop/route.js', 'utf8');

const updated = content.replace(
`          id: item.id,
          image: item.images?.featured || item.images?.icon || item.images?.smallIcon,
          related_items: item.granted || []`,
`          id: item.id,
          image: item.images?.featured || item.images?.icon || item.images?.smallIcon,
          showcaseVideo: item.showcaseVideo || null,
          related_items: item.granted || []`
);

fs.writeFileSync('app/api/shop/route.js', updated);
console.log("Updated API shop route for video");
