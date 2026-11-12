// src/pages/Faq.jsx
import { useState } from 'react';
import './App.css';

const FAQS = [
  {
    category: 'Getting Started',
    q: 'What is Buy-Sell-Barter?',
    a: 'Buy-Sell-Barter is a marketplace where you can buy items, sell what you no longer need, or trade (barter) one item for another — all in one place. You chat directly with the other person, agree on price or trade, and arrange pickup or delivery.'
  },
  {
    category: 'Getting Started',
    q: 'Do I need an account to browse?',
    a: 'No. You can browse listings without an account. You need a free account to chat, post a listing, save favourites, or make an offer.'
  },
  {
    category: 'Getting Started',
    q: 'Is it free to use?',
    a: 'Yes. Creating an account and browsing is free. Listing your items is free. We may add optional promoted listings later, but buying, selling and bartering will stay free.'
  },
  {
    category: 'Buying',
    q: 'How do I buy an item?',
    a: 'Open the listing, tap Chat / Make Offer, agree on price and pickup/delivery with the seller, then meet in a safe public place or use a delivery you both trust. Always inspect the item before paying.'
  },
  {
    category: 'Buying',
    q: 'How do I know a seller is trustworthy?',
    a: 'Check their profile, how long they have been on the platform, their ratings and previous listings. Chat on the platform, ask for clear photos/videos, and never pay before you have seen the item. If something feels off, report the listing.'
  },
  {
    category: 'Selling',
    q: 'How do I list an item for sale?',
    a: 'Tap Sell, add clear photos, title, honest description, price, condition, and your location. The clearer your photos and description, the faster it sells. You will get a chat when someone is interested.'
  },
  {
    category: 'Selling',
    q: 'Can I change my price after listing?',
    a: 'Yes. Go to My Listings > Edit and update the price, photos or description anytime. Buyers who already chatted with you will see the updated listing.'
  },
  {
    category: 'Barter',
    q: 'How does Barter (trade) work?',
    a: 'Instead of cash, you offer an item in exchange. On a listing, choose Barter / Offer Trade, send photos of what you are offering, and agree on the trade in chat. Both people should inspect the items before swapping.'
  },
  {
    category: 'Barter',
    q: 'What if the trade is not equal in value?',
    a: 'You can agree to add cash on top. For example: Phone + ₦20,000 for a Laptop. Agree on the full deal in chat before you meet, so there is no confusion.'
  },
  {
    category: 'Payments & Delivery',
    q: 'How do I pay?',
    a: 'Buy-Sell-Barter does not hold your money. You pay the seller directly — cash on pickup, bank transfer, or a delivery payment you both agree on. Never send money before seeing the item, and never share your OTP or bank PIN with anyone.'
  },
  {
    category: 'Payments & Delivery',
    q: 'Do you offer delivery?',
    a: 'We do not deliver items ourselves. You and the other person agree on pickup or a rider/dispatch you both trust. For expensive items, meet in person.'
  },
  {
    category: 'Safety',
    q: 'How do I stay safe?',
    a: '1. Meet in a public place in daytime. 2. Inspect before paying. 3. Keep chats on Buy-Sell-Barter. 4. Never share OTP, PIN or password. 5. If someone pressures you to pay fast, stop and report them.'
  },
  {
    category: 'Safety',
    q: 'What do I do if I suspect a scam?',
    a: 'Stop chatting, do not send money, screenshot the chat, and report the user/listing immediately from the Report button or from the Complaints section below. We review reports and can block accounts.'
  },
  {
    category: 'Account',
    q: 'I forgot my password. What do I do?',
    a: 'On the login page, tap Forgot Password and follow the steps to reset it. If you no longer have access to your email/phone, contact Support below.'
  },
  {
    category: 'Account',
    q: 'How do I delete my account?',
    a: 'Go to Settings > Delete Account, or message Support below and ask for deletion. Your listings will be removed and your chats will be closed.'
  },
];

function Faq() {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [openIndex, setOpenIndex] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', type: 'Support', message: '' });
  const [sent, setSent] = useState(false);

  const categories = ['All', ...new Set(FAQS.map(f => f.category))];

  const filtered = FAQS.filter(f => {
    const matchesCat = activeCat === 'All' || f.category === activeCat;
    const matchesSearch = (f.q + f.a).toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const subject = `[${form.type}] ${form.name} - Buy-Sell-Barter`;
    const body = `Name: ${form.name}%0D%0AEmail: ${form.email}%0D%0AType: ${form.type}%0D%0A%0D%0A${form.message}`;
    window.location.href = `mailto:modernheroking297@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    setSent(true);
  };

  return (
    <div className='faq-page'>
      
      <section className='faq-hero'>
        <span className='faq-badge'>Help Centre</span>
        <h1>Frequently Asked Questions</h1>
        <p>
          Welcome to <b>Buy-Sell-Barter</b> — the simple way to buy what you need,
          sell what you don't, and trade what you have. Below are answers to the
          questions most people ask. Can't find yours? Reach out below, we reply fast.
        </p>
        <input
          className='faq-search'
          placeholder='Search... e.g. "How do I pay?" "How does barter work?"'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      
      <div className='faq-cats'>
        {categories.map(cat => (
          <button
            key={cat}
            className={activeCat === cat ? 'faq-cat active' : 'faq-cat'}
            onClick={() => setActiveCat(cat)}
          >{cat}</button>
        ))}
      </div>

     
      <section className='faq-list'>
        {filtered.length === 0 && <p className='faq-empty'>No questions found. Try another search or message us below.</p>}
        {filtered.map((item, i) => (
          <div key={i} className={`faq-item ${openIndex === i ? 'open' : ''}`}>
            <button className='faq-q' onClick={() => setOpenIndex(openIndex === i ? -1 : i)}>
              <span><small>{item.category}</small>{item.q}</span>
              <span className='faq-arrow'>{openIndex === i ? '−' : '+'}</span>
            </button>
            {openIndex === i && <p className='faq-a'>{item.a}</p>}
          </div>
        ))}
      </section>

      {/* SUPPORT / COMPLAINTS / MESSAGE */}
      <section className='faq-help-grid'>
        <div className='faq-card'>
          <h2>💬 Support</h2>
          <p>Account, login, listings, chat or photo upload issues?</p>
          <ul>
            <li>Email: <b>modernheroking297@gmail.com</b></li>
            <li>WhatsApp: <b>+234 807 108 5197</b></li>
            <li>Hours: Mon - Sat, 9am - 6pm (WAT)</li>
          </ul>
          <a className='faq-btn' href='mailto:modernheroking297@gmail.com'>Email Support</a>
        </div>

        <div className='faq-card warn'>
          <h2>🚨 Complaints & Reports</h2>
          <p>Scam, fake listing, rude behaviour, or failed trade?</p>
          <ul>
            <li>Email: <b>modernheroking297@gmail.com</b></li>
            <li>Include: username, listing link, screenshots</li>
            <li>We review within 24 - 48 hours</li>
          </ul>
          <a className='faq-btn outline' href='mailto:modernheroking297@gmail.com'>Report an Issue</a>
        </div>

        <div className='faq-card form-card'>
          <h2>✉️ Send Us a Message</h2>
          <p>Tell us what happened, we will get back to you.</p>
          {sent ? (
            <p className='faq-success'>Thanks! Your email app should have opened. If it didn't, email us directly at modernheroking297@gmail.com</p>
          ) : (
            <form onSubmit={handleSubmit} className='faq-form'>
              <input placeholder='Your name' required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input type='email' placeholder='Your email' required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option>Support</option>
                <option>Complaint</option>
                <option>Report Scam / User</option>
                <option>Suggestion</option>
              </select>
              <textarea placeholder='Write your message...' rows={4} required value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              <button type='submit' className='faq-btn'>Send Message</button>
            </form>
          )}
        </div>
      </section>

      <p className='faq-footer'>Stay safe: Never share your OTP, PIN or password. Buy-Sell-Barter will never ask for it.</p>
    </div>
  );
}

export default Faq;