const fs = require('fs');
const content = fs.readFileSync('app/api/shop/route.js', 'utf8');

const updated = content.replace(
`        parsedItems.push({
          section,
          name: bundleName,
          type: "Pack",
          rarity: "Pack",
          vbucks: vbucksPrice,
          price: calcPrice,
          id: entry.offerId || \`pack-\${bundleName.replace(/\\s/g, '-')}\`,
          image: bundleImage,
          is_bundle: true
        });`,
`        parsedItems.push({
          section,
          name: bundleName,
          description: entry.bundle?.info || "Un pack fantastique Fortnite !",
          type: "Pack",
          rarity: "Pack",
          vbucks: vbucksPrice,
          price: calcPrice,
          id: entry.offerId || \`pack-\${bundleName.replace(/\\s/g, '-')}\`,
          image: bundleImage,
          is_bundle: true,
          bundle_items: brItems
        });`
).replace(
`        parsedItems.push({
          section,
          name: item.name || item.title || "Objet Fortnite",
          description: item.description || "",
          type: item.type?.displayValue || "Autres",
          rarity: { value: item.rarity?.value || "Common" },
          vbucks: vbucksPrice,
          price: calcPrice,
          id: item.id,
          image: item.images?.featured || item.images?.icon || item.images?.smallIcon
        });`,
`        parsedItems.push({
          section,
          name: item.name || item.title || "Objet Fortnite",
          description: item.description || "",
          type: item.type?.displayValue || "Autres",
          rarity: { value: item.rarity?.value || "Common" },
          vbucks: vbucksPrice,
          price: calcPrice,
          id: item.id,
          image: item.images?.featured || item.images?.icon || item.images?.smallIcon,
          related_items: item.granted || []
        });`
);

fs.writeFileSync('app/api/shop/route.js', updated);
console.log("Updated API shop route");
