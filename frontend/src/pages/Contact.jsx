import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useFormSubmission } from "@/hooks/useFormSubmission";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const form = useFormSubmission();

  const navigateTo = useNavigate();
  const handleContactForm = async (e) => {
    e.preventDefault();
    if ([name, email, subject, message].some((value) => !value.trim())) {
      form.setError("Enter your name, email, subject, and message."); return;
    }

    const templateParams = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    };

    await form.submit(async () => {
      const { data } = await axios.post("/api/v1/user/contact", templateParams);
      toast.success(data.message);
      navigateTo("/");
      return data;
    });
  };

  return (
    <>
      <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-4 justify-start">
        <div className="bg-white mx-auto w-full h-auto px-2 flex flex-col gap-4 items-center py-4 justify-center rounded-md">
          <form
            className="flex flex-col gap-5 w-full"
            onSubmit={handleContactForm}
            aria-busy={form.submitting}
          >
            <h3
              className={`text-[#D6482B] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl`}
            >
              Contact Us
            </h3>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-name" className="text-[16px] text-stone-500">Your Name</label>
              <input
                id="contact-name" autoComplete="name" maxLength={100}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#D6482B]"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-email" className="text-[16px] text-stone-500">Your Email</label>
              <input
                id="contact-email" autoComplete="email" maxLength={254}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#D6482B]"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-phone" className="text-[16px] text-stone-500">Your Phone (optional)</label>
              <input
                id="contact-phone" autoComplete="tel" maxLength={30}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#D6482B]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-subject" className="text-[16px] text-stone-500">Subject</label>
              <input
                id="contact-subject" maxLength={150}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#D6482B]"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-message" className="text-[16px] text-stone-500">Message</label>
              <textarea
                id="contact-message" maxLength={4000}
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#D6482B]"
                required
              />
            </div>

            {form.error && <p role="alert" className="text-[#b8381e]">{form.error}</p>}
            <button
              className="bg-[#d6482b] mx-auto font-semibold hover:bg-[#b8381e] text-xl transition-all duration-300 py-2 px-4 rounded-md text-white my-4"
              disabled={form.submitting}
              type="submit"
            >
              {form.submitting ? "Sending Message..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default Contact;
