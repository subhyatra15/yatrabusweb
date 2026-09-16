// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  X,
  Mail,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Ticket,
  CreditCard,
  User,
  Bus,
  RefreshCw,
  Info,
  HelpCircle,
  Bell,
  Send,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  DollarSign,
  Shield,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Types
interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface Category {
  id: string;
  icon: any;
  title: string;
  color: string;
  bg: string;
  count: number;
}

interface QuickAction {
  icon: any;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}

export default function HelpSupportPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const categories: Category[] = [
    {
      id: "booking",
      icon: Ticket,
      title: "Booking",
      color: "#4f46e5",
      bg: "rgba(79, 70, 229, 0.08)",
      count: 8,
    },
    {
      id: "payment",
      icon: CreditCard,
      title: "Payment",
      color: "#059669",
      bg: "rgba(5, 150, 105, 0.08)",
      count: 6,
    },
    {
      id: "account",
      icon: User,
      title: "Account",
      color: "#7c3aed",
      bg: "rgba(124, 58, 237, 0.08)",
      count: 5,
    },
    {
      id: "trip",
      icon: Bus,
      title: "Trip Issues",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.08)",
      count: 7,
    },
    {
      id: "refund",
      icon: RefreshCw,
      title: "Refunds",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.08)",
      count: 4,
    },
    {
      id: "general",
      icon: Info,
      title: "General",
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.08)",
      count: 9,
    },
  ];

  const faqs: FAQ[] = [
    {
      id: "1",
      category: "booking",
      question: "How do I book a bus ticket?",
      answer:
        "To book a bus ticket, open the app, select your departure and destination cities, choose your travel date, select a bus from the available options, pick your preferred seats, and proceed to payment. Once payment is confirmed, you'll receive a digital ticket via email and in-app.",
    },
    {
      id: "2",
      category: "booking",
      question: "Can I cancel my booking?",
      answer:
        "Yes, you can cancel your booking up to 24 hours before departure for a full refund. Cancellations within 24 hours may incur a cancellation fee. To cancel, go to 'My Bookings', select the booking, and tap 'Cancel Booking'.",
    },
    {
      id: "3",
      category: "payment",
      question: "What payment methods are accepted?",
      answer:
        "We accept eSewa, Khalti, Credit/Debit Cards (Visa, Mastercard), and Bank Transfer. All payments are processed securely through our payment partners.",
    },
    {
      id: "4",
      category: "payment",
      question: "Is my payment information secure?",
      answer:
        "Yes, we use industry-standard encryption and security measures to protect your payment information. We partner with trusted payment gateways like eSewa and Khalti for secure transactions.",
    },
    {
      id: "5",
      category: "account",
      question: "How do I reset my password?",
      answer:
        "To reset your password, go to the login screen and tap 'Forgot Password'. Enter your registered email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password.",
    },
    {
      id: "6",
      category: "trip",
      question: "What happens if my bus is delayed?",
      answer:
        "If your bus is delayed, you'll receive real-time updates through the app. You can also track your bus location on the live map. If the delay is significant, we'll help you find alternative options.",
    },
    {
      id: "7",
      category: "refund",
      question: "How long does it take to get a refund?",
      answer:
        "Refunds are typically processed within 3-5 business days after the cancellation is confirmed. The refund will be credited to your original payment method. You'll receive a confirmation email once the refund is initiated.",
    },
    {
      id: "8",
      category: "general",
      question: "How do I contact customer support?",
      answer:
        "You can reach our customer support team via phone at +977 980-1234567, email at support@eticket.com, or through the in-app chat feature. We're available 24/7 to assist you.",
    },
  ];

  const quickActions: QuickAction[] = [
    {
      icon: Mail,
      title: "Email Support",
      subtitle: "support@eticket.com",
      color: "#059669",
      onClick: () => {
        window.location.href = "mailto:support@eticket.com";
      },
    },
    {
      icon: Phone,
      title: "Call Us",
      subtitle: "+977 980-1234567",
      color: "#7c3aed",
      onClick: () => {
        window.location.href = "tel:+9779801234567";
      },
    },
    {
      icon: HelpCircle,
      title: "FAQs",
      subtitle: "Frequently asked questions",
      color: "#f59e0b",
      onClick: () => {},
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedCategory
    ? faqs.filter((faq) => faq.category === selectedCategory)
    : faqs;

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Contact Modal
  const ContactModal = () => (
    <AnimatePresence>
      {showContactModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowContactModal(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Contact Support</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-3">
              {/* Live Chat */}
              <div className="flex items-center gap-4 bg-slate-50/80 rounded-xl p-4 border border-slate-200/50">
                <div className="w-12 h-12 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Live Chat</p>
                  <p className="text-sm text-slate-400">Chat with our support team</p>
                </div>
                <button
                  onClick={() => toast.error("Chat feature coming soon!")}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
                >
                  Chat Now
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 bg-slate-50/80 rounded-xl p-4 border border-slate-200/50">
                <div className="w-12 h-12 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Email</p>
                  <p className="text-sm text-slate-400">support@eticket.com</p>
                </div>
                <button
                  onClick={() => (window.location.href = "mailto:support@eticket.com")}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
                >
                  Send Email
                </button>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4 bg-slate-50/80 rounded-xl p-4 border border-slate-200/50">
                <div className="w-12 h-12 rounded-xl bg-linear-to-r from-purple-600 to-purple-500 flex items-center justify-center shadow-md shadow-purple-500/20 flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Phone</p>
                  <p className="text-sm text-slate-400">+977 980-1234567</p>
                </div>
                <button
                  onClick={() => (window.location.href = "tel:+9779801234567")}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors"
                >
                  Call Now
                </button>
              </div>

              <button
                onClick={() => {
                  setShowContactModal(false);
                  toast.error("Your support request has been submitted!");
                }}
                className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                Submit Ticket
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </motion.button>
              <h1 className="text-lg font-bold text-gray-900">Help & Support</h1>
            </div>
       
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/50 shadow-sm">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for help..."
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-slate-400 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Support</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={action.onClick}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 text-left hover:shadow-lg transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: action.color + "15" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: action.color }} />
                  </div>
                  <p className="font-semibold text-gray-900">{action.title}</p>
                  <p className="text-sm text-slate-400">{action.subtitle}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">Browse by Category</h3>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setSelectedCategory(isActive ? null : category.id)
                  }
                  className={cn(
                    "bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border p-4 text-center transition-all relative",
                    isActive
                      ? "border-indigo-500 shadow-lg shadow-indigo-500/10"
                      : "border-slate-100/50 hover:border-indigo-200"
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: category.bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: category.color }} />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{category.title}</p>
                  <p className="text-xs text-slate-400">{category.count} articles</p>
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>

          {filteredFaqs.length > 0 ? (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        {expandedFaq === faq.id ? (
                          <Minus className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Plus className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">{faq.question}</span>
                    </div>
                    {expandedFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedFaq === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-3xl">
              <Search className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-gray-900 mt-4">No results found</h3>
              <p className="text-sm text-slate-400 mt-2">Try adjusting your search or filter</p>
            </div>
          )}
        </motion.div>

        {/* Contact Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <div className="bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-600 rounded-2xl p-6 text-center shadow-lg shadow-indigo-500/20">
            <MessageCircle className="w-10 h-10 text-white mx-auto" />
            <h3 className="text-xl font-bold text-white mt-3">Still need help?</h3>
            <p className="text-white/80 text-sm mt-1">Our support team is available 24/7</p>
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center gap-2 mt-4 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Contact Us
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </main>

      {/* Contact Modal */}
      <ContactModal />
    </div>
  );
}