import { Link } from 'react-router-dom';
import './Procurement.css';

export default function Procurement() {
  return (
    <main className="procurement-page">
      <section className="procurement-hero">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Smart procurement</span>
          </div>
          <h1 className="procurement-title">Ordering that remembers what you buy.</h1>
          <p className="procurement-lead">
            We're building VDS to make reordering fast and quotes painless. Here's exactly what works today, what's being built, and what we're holding back until it earns its place.
          </p>
        </div>
      </section>

      <section className="procurement-content">
        <div className="container">
          <div className="road">
            <div>
              <span className="chip now">Available now</span>
              <h3>On this site</h3>
              <ul>
                <li>
                  <b>Search that speaks clinic</b>
                  <span>Finds products by everyday and clinical terms: “jelly”, “x-ray apron”, “probe reprocessing”.</span>
                </li>
                <li>
                  <b>Quote list</b>
                  <span>Add products and quantities as you browse, then send one request.</span>
                </li>
                <li>
                  <b>Side-by-side compare</b>
                  <span>Compare up to three products on use, documents and regulatory status.</span>
                </li>
                <li>
                  <b>Invoice price check</b>
                  <span>Share what you buy now and we quote the same lines.</span>
                </li>
              </ul>
            </div>
            
            <div>
              <span className="chip next">In development</span>
              <h3>Trade accounts</h3>
              <ul>
                <li>
                  <b>Account pricing</b>
                  <span>Your agreed prices shown when you sign in.</span>
                  <span className="dep">Needs: account system and pricing data</span>
                </li>
                <li>
                  <b>One-click reorder</b>
                  <span>Your usual list, ready to resend.</span>
                  <span className="dep">Needs: order history from our ordering system</span>
                </li>
                <li>
                  <b>Order and delivery tracking</b>
                  <span>Status and tracking for every order.</span>
                  <span className="dep">Needs: freight and inventory integration</span>
                </li>
                <li>
                  <b>Document library</b>
                  <span>Every IFU and certificate for what you've bought, in one place.</span>
                </li>
              </ul>
            </div>

            <div>
              <span className="chip later">Later, if it earns it</span>
              <h3>Assisted buying</h3>
              <ul>
                <li>
                  <b>Ask-in-plain-English assistant</b>
                  <span>“What do I need for a new ultrasound room?”, answered from our catalogue and documents.</span>
                  <span className="dep">Needs: a fuller catalogue and validated product data</span>
                </li>
                <li>
                  <b>Usage-based reorder reminders</b>
                  <span>A nudge when you're likely to run low.</span>
                  <span className="dep">Needs: several months of order history</span>
                </li>
                <li>
                  <b>Live stock visibility</b>
                  <span>Real availability before you order.</span>
                  <span className="dep">Needs: live inventory integration</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="callout-container">
            <div className="callout">
              <p>
                Nothing in the “in development” or “later” columns is live yet. If one of them would change how you buy, <Link to="/request-quote?need=Product question" className="link">tell us</Link>. It moves up the list.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
