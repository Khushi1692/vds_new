import { Link } from 'react-router-dom';
import { useState } from 'react';
import './OrderingDelivery.css';

export default function OrderingDelivery() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  const faqs = [
    {
      question: "Do you have minimum order quantities?",
      answer: "It depends on the product. Tell us your monthly use and we'll quote the pack sizes that make sense for you."
    },
    {
      question: "Where do you deliver?",
      answer: "We supply clinics across Australia from our base in Clyde North, Victoria. Delivery times depend on where you are; we confirm them with every quote."
    },
    {
      question: "How do I pay?",
      answer: "Approved trade accounts are invoiced on agreed terms. New customers can pay on invoice before dispatch while an account is set up."
    },
    {
      question: "Can I get documents before I order?",
      answer: <>Yes. Datasheets, instructions for use and regulatory details go out with your quote. <Link to="/contact" className="link">Request documents</Link></>
    },
    {
      question: "Something arrived damaged or wrong. What now?",
      answer: "Contact us first with your order details and a photo. We'll arrange a replacement or return. Please don't send stock back without talking to us."
    },
    {
      question: "How will I hear about a recall?",
      answer: "For products we sponsor, we keep supply records by batch and contact affected customers directly, alongside any TGA notice."
    }
  ];

  return (
    <main className="ordering-page">
      <section className="ordering-hero">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Ordering & delivery</span>
          </div>
          <h1 className="ordering-title">How ordering works</h1>
          <p className="ordering-lead">
            From first question to delivered stock, here's the process, and who to call at each step.
          </p>
        </div>
      </section>

      <section className="ordering-steps-section">
        <div className="container">
          <ol className="steps-list">
            <li>
              <b>Ask or upload</b>
              <span>Send a product list, an invoice or a question.</span>
            </li>
            <li>
              <b>Quote</b>
              <span>Prices, pack units and documents, in writing.</span>
            </li>
            <li>
              <b>Purchase order</b>
              <span>Reply with a PO or approve the quote.</span>
            </li>
            <li>
              <b>Dispatch</b>
              <span>We confirm the delivery date and send tracking.</span>
            </li>
            <li>
              <b>Invoice</b>
              <span>On your trade account terms once approved.</span>
            </li>
          </ol>
        </div>
      </section>

      <section className="ordering-faq-section">
        <div className="container split">
          <div className="stack">
            <span className="eyebrow">Questions</span>
            <h2 className="section-title">Ordering FAQs</h2>
            <div className="urgent-card">
              <b>Running out today?</b>
              <p>Call <span className="mono">0422 228 496</span>, including after hours, and tell us what you need and where.</p>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openFaq === index ? 'open' : ''}`}
              >
                <button 
                  className="faq-summary" 
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaq === index}
                >
                  {faq.question}
                </button>
                <div className="faq-content">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
