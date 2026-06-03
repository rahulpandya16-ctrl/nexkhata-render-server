// ☁️ NEXKHATA CLOUD RELAY SERVER (FOR RENDER)
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🗄️ Temporary Cloud Memory (Post Office Box)
// Note: Asli production me isko MongoDB/Firebase me rakhte hain,
// par Render demo ke liye ye memory array perfect hai!
let postOfficeBox = [];

app.get("/", (req, res) => {
  res.send("☁️ NexKhata B2B Relay Server is LIVE! (Running on Render)");
});

// 📤 1. SENDER: Jab koi offline NexKhata bill banayega, wo yahan aayega
app.post("/api/relay/send", (req, res) => {
  const {
    sender_name,
    sender_gstin,
    receiver_gstin,
    invoice_no,
    amount,
    date,
  } = req.body;

  if (!receiver_gstin) {
    return res
      .status(400)
      .json({ success: false, message: "Receiver GSTIN is missing!" });
  }

  const newBill = {
    id: Date.now(), // Unique ID
    sender_name,
    sender_gstin,
    receiver_gstin,
    invoice_no,
    amount,
    date,
    status: "Pending",
  };

  postOfficeBox.push(newBill);
  console.log(
    `📦 POST OFFICE: Naya bill aaya hai [${sender_name}] se [${receiver_gstin}] ke liye.`,
  );

  res.status(200).json({
    success: true,
    message: "☁️ Bill successfully received by NexKhata Cloud!",
  });
});

// 📥 2. RECEIVER: Jab offline NexKhata apna Inbox check karega
app.get("/api/relay/receive/:gstin", (req, res) => {
  const myGstin = req.params.gstin;

  // Mere GSTIN wale bill dhoondo
  const myBills = postOfficeBox.filter(
    (bill) => bill.receiver_gstin === myGstin,
  );

  // 🔒 SECURITY: Jo bill nikal gaye, unhe Cloud se hamesha ke liye Delete kar do!
  postOfficeBox = postOfficeBox.filter(
    (bill) => bill.receiver_gstin !== myGstin,
  );

  if (myBills.length > 0) {
    console.log(
      `🚚 DELIVERY: [${myGstin}] ne apne ${myBills.length} bills nikal liye. Cloud clean kar diya.`,
    );
  }

  res.status(200).json({ success: true, count: myBills.length, data: myBills });
});

// ====================================================
// 💓 4. HEARTBEAT API & MANUAL BLOCK SYSTEM (ANTI-PIRACY)
// ====================================================

const activeLicenses = {};
// यह वो लिस्ट है जहाँ हम उन लाइसेंस को रखेंगे जिन्हें आपने मैन्युअली ब्लॉक किया है
const manuallyBlockedKeys = new Set();

// 🛑 A. API: किसी भी लाइसेंस को अपनी मर्ज़ी से ब्लॉक करने के लिए (आपके इस्तेमाल के लिए)
app.post("/api/cloud/block-license", (req, res) => {
  const { license_key, admin_password } = req.body;

  // सुरक्षा के लिए एक छोटा सा पासवर्ड ताकि कोई और इसे ब्लॉक न कर सके
  if (admin_password !== "NEXKHATA_ADMIN_786") {
    return res.status(401).json({ success: false, message: "Unauthorized!" });
  }

  if (!license_key) {
    return res
      .status(400)
      .json({ success: false, message: "License key is required!" });
  }

  manuallyBlockedKeys.add(license_key);
  console.log(
    `⛔ ADMIN ACTION: License [${license_key}] has been MANUALLY BLOCKED!`,
  );

  res
    .status(200)
    .json({
      success: true,
      message: `License ${license_key} is successfully blocked.`,
    });
});

// 🟢 B. API: सॉफ़्टवेयर की हार्टबीट (जो डेस्कटॉप से बैकग्राउंड में आएगी)
app.post("/api/cloud/heartbeat", (req, res) => {
  try {
    const { license_key, machine_code, version, company_name } = req.body;
    const client_ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (!license_key || !machine_code) {
      return res
        .status(400)
        .json({ success: false, message: "Missing License Data!" });
    }

    // 🛑 शर्त 1: क्या यह की (Key) एडमिन द्वारा मैन्युअली ब्लॉक की गई है?
    if (manuallyBlockedKeys.has(license_key)) {
      console.log(
        `🚨 MANUAL BLOCK TRIGGERED: Key [${license_key}] tried to connect!`,
      );
      return res.status(403).json({
        success: false,
        block: true,
        message:
          "Your license has been manually suspended by the Administrator.",
      });
    }

    // एक्टिव लाइसेंस को ट्रैक करना
    if (!activeLicenses[license_key]) {
      activeLicenses[license_key] = new Set();
    }
    activeLicenses[license_key].add(machine_code);

    console.log(
      `💓 Heartbeat: Key [${license_key}] | Machine: [${machine_code}] | IP: [${client_ip}] | Firm: ${company_name}`,
    );

    // 🛑 शर्त 2: ऑटो-पायरेसी चेक (क्या एक ही की 2 से ज़्यादा PC पर चल रही है?)
    if (activeLicenses[license_key].size > 2) {
      console.log(
        `🚨 PIRACY DETECTED: Key [${license_key}] running on multiple PCs!`,
      );
      return res.status(403).json({
        success: false,
        block: true,
        message: "Piracy Detected! License running on multiple computers.",
      });
    }

    // सब सुरक्षित है
    res.status(200).json({ success: true, block: false, message: "Verified." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Heartbeat Server Error" });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`☁️ Relay Server is running on port ${PORT}`);
});
