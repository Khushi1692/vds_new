import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crosshair, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import './InteractiveRoom.css';

// 14 Products mapped with precise room hotspot coordinates (%)
const ROOM_HOTSPOTS = [
  {
    num: 1,
    id: 'exam-couch-hilo',
    name: 'Premium Hi-Lo Examination Couch',
    category: 'Furniture and Patient Transfer',
    catGroup: 'furniture',
    sku: 'EX-COUCH-HL',
    price: '$1,699.00 / Each',
    artg: 'ARTG 203847',
    tagline: 'Versatile electric 2-motor positioning for clinics & ultrasound suites',
    image: '/images/exam_couch.webp',
    x: 26,
    y: 78,
    tooltipPlacement: 'top'
  },
  {
    num: 2,
    id: 'exam-bed-sheet-10',
    name: 'Disposable Bedsheet',
    category: 'Infection Prevention',
    catGroup: 'infection',
    sku: 'EX-BED-01',
    price: '$79.49 / Box of 100',
    artg: 'ARTG 102934',
    tagline: '240 × 70 cm · Non-woven fluid-resistant barrier for examination couches',
    image: '/images/exam_bed_sheet_10.webp',
    x: 23,
    y: 64,
    tooltipPlacement: 'top'
  },
  {
    num: 3,
    id: 'ultra-med-roll',
    name: 'Ultra Medical Roll',
    category: 'Everyday Paper Supplies',
    catGroup: 'paper',
    sku: 'EX-ROLL-01',
    price: '$58.20 / Carton',
    artg: null,
    tagline: 'Continuous couch roll dispenser protection with easy-tear perforations',
    image: '/images/ultra_medical_roll.webp',
    x: 66.8,
    y: 55.3,
    tooltipPlacement: 'top'
  },
  {
    num: 4,
    id: 'xray-protective-apron',
    name: 'Xray Lead Protective Gown',
    category: 'Medical Imaging Consumables',
    catGroup: 'imaging',
    sku: 'XR-APRON-01',
    price: '$349.00 / Each',
    artg: 'ARTG 401823',
    tagline: '0.50mm Pb radiation protection for imaging staff & radiologists',
    image: '/images/x_ray_protective_apron.webp',
    x: 20.5,
    y: 48,
    tooltipPlacement: 'top'
  },
  {
    num: 5,
    id: 'exam-gown-regular',
    name: 'Disposable Gowns',
    category: 'Infection Prevention',
    catGroup: 'infection',
    sku: 'EX-GOWN-REG',
    price: '$76.00 / Box of 100',
    artg: 'ARTG 394857',
    tagline: 'Single-use breathable non-woven patient gowns on examination table',
    image: '/images/patient_examination_gown.webp',
    x: 61.2,
    y: 53.5,
    tooltipPlacement: 'top'
  },
  {
    num: 6,
    id: 'us-gel-250ml',
    name: 'Ultrasound Gel 250ML',
    category: 'Medical Imaging Consumables',
    catGroup: 'imaging',
    sku: 'GEL-250ML',
    price: '$4.20 / Squeeze Bottle',
    artg: 'ARTG 530981',
    tagline: 'VDS is direct ARTG sponsor · Acoustically correct clear transmission formula',
    image: '/images/ultrasound_gel_250ML.webp',
    x: 40.3,
    y: 55.3,
    tooltipPlacement: 'top'
  },
  {
    num: 7,
    id: 'us-gel-5l',
    name: 'Ultrasound Gel 5L',
    category: 'Medical Imaging Consumables',
    catGroup: 'imaging',
    sku: 'GEL-5L-CUB',
    price: '$34.50 / 5L Cubitainer',
    artg: 'ARTG 530981',
    tagline: 'Bulk supply cubitainer with free 250ml dispensing bottle included',
    image: '/images/ultrasound_gel_5L.webp',
    x: 77.0,
    y: 53.0,
    tooltipPlacement: 'top'
  },
  {
    num: 8,
    id: 'thermasonic-gel-warmer',
    name: 'Ultrasound Gel Warmer',
    category: 'Medical Equipment',
    catGroup: 'imaging',
    sku: 'TG-WARM-01',
    price: '$294.90 / Each',
    artg: 'ARTG 495823',
    tagline: 'Rapid microprocessor-controlled heating for optimal patient comfort',
    image: '/images/thermasonic_gel_warmer.webp',
    x: 72.7,
    y: 53.5,
    tooltipPlacement: 'top'
  },
  {
    num: 9,
    id: 'med-warming-cabinet',
    name: 'Medical Warming Cabinet',
    category: 'Medical Equipment',
    catGroup: 'furniture',
    sku: 'MC-WARM-01',
    price: '$2,850.00 / Each',
    artg: 'ARTG 412890',
    tagline: 'Stainless steel heated cabinet for blankets, fluids, and clinical linens',
    image: '/images/medical_warming_cabinet.webp',
    x: 63.5,
    y: 68.0,
    tooltipPlacement: 'top'
  },
  {
    num: 10,
    id: 'uv-probe-disinfector',
    name: 'UV-C LED Ultrasound Probe Disinfector',
    category: 'Medical Equipment',
    catGroup: 'infection',
    sku: 'UV-DIS-01',
    price: '$4,200.00 / Unit',
    artg: 'ARTG 582910',
    tagline: 'High-level disinfection in under 60 seconds with no harmful chemicals',
    image: '/images/ultrasound_probe_disinfector.webp',
    x: 54.7,
    y: 54.5,
    tooltipPlacement: 'top'
  },
  {
    num: 11,
    id: 'tisora-facial-tissue',
    name: 'Tisora Facial Tissue',
    category: 'Everyday Paper Supplies',
    catGroup: 'paper',
    sku: 'TIS-FAC-01',
    price: '$32.00 / Carton',
    artg: null,
    tagline: 'Ultra-soft 2-ply clinical tissues for ultrasound gel clean-up',
    image: '/images/tisora_facial_tissue.webp',
    x: 80.5,
    y: 54.0,
    tooltipPlacement: 'top'
  },
  {
    num: 12,
    id: 'sony-upp-110hg',
    name: 'Sony UPP-110HG Thermal Paper',
    category: 'Medical Imaging Consumables',
    catGroup: 'imaging',
    sku: 'SNY-110HG',
    price: '$189.00 / Pack of 10',
    artg: 'ARTG 318290',
    tagline: 'High-gloss A6 black & white thermal print media for ultrasound diagnostics',
    image: '/images/sony_upp_110hg_print_media.webp',
    x: 43.5,
    y: 74.5,
    tooltipPlacement: 'top'
  },
  {
    num: 13,
    id: 'mri-safe-wheelchair',
    name: 'MR SAFE Non-Metal Wheelchair',
    category: 'Furniture and Patient Transfer',
    catGroup: 'furniture',
    sku: 'MR-WCH-01',
    price: '$1,890.00 / Each',
    artg: 'ARTG 298412',
    tagline: '100% non-magnetic polymer construction tested for up to 3.0 Tesla MRI zones',
    image: '/images/non_metal_wheelchair.webp',
    x: 88.0,
    y: 70.3,
    tooltipPlacement: 'top'
  },
  {
    num: 14,
    id: 'tisora-toilet-tissue',
    name: 'Tisora Toilet Tissue Paper',
    category: 'Everyday Paper Supplies',
    catGroup: 'paper',
    sku: 'TIS-TOI-01',
    price: '$45.00 / Carton of 48',
    artg: null,
    tagline: 'Hospital & clinic facility grade 2-ply soft embossed rolls',
    image: '/images/tisora_toilet_tissue_paper.webp',
    x: 70.8,
    y: 71.0,
    tooltipPlacement: 'top'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Equipment', count: 14 },
  { id: 'imaging', label: 'Ultrasound & Imaging', count: 5 },
  { id: 'furniture', label: 'Couch & Patient Transfer', count: 3 },
  { id: 'infection', label: 'Infection Prevention', count: 3 },
  { id: 'paper', label: 'Clinical Paper Supplies', count: 3 }
];

// Helper to prevent preview cards from clipping past viewport edges
const getAlignClass = (x) => {
  if (x <= 30) return 'align-left';
  if (x >= 70) return 'align-right';
  return 'align-center';
};

export default function InteractiveRoom({ dbProducts = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Merge live DB data if available
  const products = ROOM_HOTSPOTS.map((spot) => {
    const live = dbProducts.find((p) => p.id === spot.id || p.sku === spot.sku);
    if (!live) return spot;
    return {
      ...spot,
      name: live.name || spot.name,
      price: live.priceLabel || `$${live.price?.toFixed(2)}` || spot.price,
      artg: live.artgNumber || spot.artg,
      tagline: live.tagline || spot.tagline,
      liveStock: live.liveStock !== undefined ? live.liveStock : 50
    };
  });

  const filteredSpots = products.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.catGroup === activeCategory;
  });

  // Navigate to product page on click or when user triggers navigation
  const handleGoToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const currentActiveId = hoveredId || pinnedId;
  const currentActiveProduct = products.find((p) => p.id === currentActiveId);

  return (
    <section className="interactive-room-section" id="interactive-suite">
      <div className="container">
        {/* Section Header */}
        <div className="room-header">
          <div className="room-header__badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Interactive Clinical Suite · 360° Showroom</span>
          </div>

          <h2 className="room-header__title">
            Explore our range in a real clinic setting
          </h2>

          <p className="room-header__subtitle">
            Hover over any equipment or hotspot in this Australian diagnostic ultrasound suite to inspect specs, ARTG registrations, and direct pricing. Click on any item to open its product page.
          </p>

          {/* Category Filter Pills */}
          <div className="room-filters" role="tablist" aria-label="Room product categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`room-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setHoveredId(null);
                  setPinnedId(null);
                }}
              >
                <span>{cat.label}</span>
                <span className="room-filter-count">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Interactive Room Viewport ── */}
        <div className="room-viewport-wrapper">
          <div 
            className="room-viewport" 
            ref={containerRef}
            onClick={(e) => {
              // If click happened on the background, clear pinned
              if (e.target === containerRef.current || e.target.classList.contains('room-image')) {
                setPinnedId(null);
              }
            }}
          >
            {/* Background 3D High-Res Clinic Room Image & Lighting */}
            <div className="room-viewport__media" aria-hidden="true">
              <img 
                src="/images/interactive-clinic-room.jpg" 
                alt="State-of-the-art Australian Diagnostic and Ultrasound Clinic Examination Room" 
                className="room-image"
                loading="eager"
              />

              {/* Ambient Lighting & Scanline Overlays */}
              <div className="room-overlay-ambient" />
              <div className="room-vignette" />
            </div>

            {/* HUD Status Bar in Top Left */}
            <div className="room-hud-tag" aria-hidden="true">
              <span className="room-hud-dot" />
              <span>Diagnostic Suite A-01 · Melbourne, VIC</span>
              <span className="room-hud-counter">
                {filteredSpots.length} Products Active
              </span>
            </div>

            {/* Hint in Top Right */}
            <div className="room-hint-tag" aria-hidden="true">
              <Crosshair size={13} />
              <span>Hover or click any pin to view product</span>
            </div>

            {/* ── Hotspot Markers ── */}
            {filteredSpots.map((spot, index) => {
              const isHovered = hoveredId === spot.id;
              const isPinned = pinnedId === spot.id;
              const isActive = isHovered || isPinned;

              return (
                <div
                  key={spot.id}
                  className={`room-hotspot-container ${isActive ? 'is-active' : ''}`}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                  }}
                  onMouseEnter={() => setHoveredId(spot.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Clickable Radar Hotspot Button */}
                  <button
                    type="button"
                    className="room-hotspot-pin"
                    onClick={() => handleGoToProduct(spot.id)}
                    aria-label={`View ${spot.name}`}
                    title={`Click to view ${spot.name}`}
                  >
                    <span className="pulse-wave" />
                    <span className="pulse-wave pulse-wave--delayed" />
                    <span className="pin-core">
                      <span className="pin-number">{spot.num || index + 1}</span>
                    </span>
                  </button>

                  {/* Floating Glassmorphic Tooltip / Product Preview Card */}
                  <div 
                    className={`room-card-preview placement-${spot.tooltipPlacement || 'top'} ${getAlignClass(spot.x)} ${isActive ? 'visible' : ''}`}
                    onClick={() => handleGoToProduct(spot.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGoToProduct(spot.id);
                    }}
                  >
                    <div className="room-card-preview__image-wrapper">
                      <img 
                        src={spot.image} 
                        alt={spot.name} 
                        className="room-card-preview__img" 
                      />
                      {spot.artg && (
                        <span className="room-card-preview__artg">
                          <ShieldCheck size={11} /> {spot.artg}
                        </span>
                      )}
                    </div>

                    <div className="room-card-preview__body">
                      <div className="room-card-preview__category">
                        {spot.category}
                      </div>

                      <h4 className="room-card-preview__title">
                        {spot.name}
                      </h4>

                      <p className="room-card-preview__tagline">
                        {spot.tagline}
                      </p>

                      <div className="room-card-preview__footer">
                        <div className="room-card-preview__price-block">
                          <span className="room-card-preview__price">
                            {spot.price}
                          </span>
                          <span className="room-card-preview__stock">
                            <span className="stock-dot" /> In Stock
                          </span>
                        </div>

                        <span className="room-card-preview__cta">
                          Go to page <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>



        {/* Clinical Value Guarantee Strip */}
        <div className="room-badges-banner">
          <div className="room-badge-item">
            <ShieldCheck size={20} className="badge-icon" />
            <div>
              <strong>TGA / ARTG Registered</strong>
              <span>VDS is direct legal sponsor</span>
            </div>
          </div>
          <div className="room-badge-item">
            <Check size={20} className="badge-icon" />
            <div>
              <strong>Direct Manufacturer Supply</strong>
              <span>No middleman markups</span>
            </div>
          </div>
          <div className="room-badge-item">
            <Sparkles size={20} className="badge-icon" />
            <div>
              <strong>Hospital & Clinic Tested</strong>
              <span>High compliance & hygiene</span>
            </div>
          </div>
          <div className="room-badge-item">
            <ExternalLink size={20} className="badge-icon" />
            <div>
              <strong>Australia-Wide Dispatch</strong>
              <span>Warehoused locally in Melbourne</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
