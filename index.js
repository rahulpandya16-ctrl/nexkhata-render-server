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

// 🚀 Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`☁️ Relay Server is running on port ${PORT}`);
});
