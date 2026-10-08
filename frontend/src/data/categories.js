const categories = [
  {
    id: 'medical-imaging-consumables',
    code: 'CAT-01',
    name: 'Medical Imaging Consumables',
    description: 'Coupling gel, print media, and radiation protection.',
    longDescription: 'High-quality coupling gel, high-density thermal print media, and premium radiation shielding aprons.',
    icon: 'Radio',
    productCount: 4,
  },
  {
    id: 'infection-prevention',
    code: 'CAT-02',
    name: 'Infection Prevention',
    description: 'Disposable gowns, bedsheets, and related apparel.',
    longDescription: 'Single-use fluid-resistant examination bedsheets and breathable protective patient gowns.',
    icon: 'ShieldAlert',
    productCount: 2,
  },
  {
    id: 'furniture-patient-transfer',
    code: 'CAT-03',
    name: 'Furniture and Patient Transfer',
    description: 'Examination couches and MRI safe wheelchairs.',
    longDescription: 'Motorised hi-lo examination couches and 100% non-metal MR safe transport wheelchairs.',
    icon: 'Move',
    productCount: 2,
  },
  {
    id: 'medical-equipment',
    code: 'CAT-04',
    name: 'Medical Equipment',
    description: 'Gel warmers, warming cabinets, and UV-C probe disinfectors.',
    longDescription: 'Microprocessor-controlled gel warmers, hospital fluid/blanket warming cabinets, and UV-C probe disinfectors.',
    icon: 'Activity',
    productCount: 3,
  },
  {
    id: 'everyday-paper-supplies',
    code: 'CAT-05',
    name: 'Everyday Paper Supplies',
    description: 'Medical rolls and tissue papers.',
    longDescription: 'Absorbent virgin wood pulp 2-ply medical examination rolls, ultra-soft facial tissues, and quick-disintegration toilet paper.',
    icon: 'Briefcase',
    productCount: 3,
  },
];

export default categories;

export const getCategoryById = (id) => categories.find((c) => c.id === id);
