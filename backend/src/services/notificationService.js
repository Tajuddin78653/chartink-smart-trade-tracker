const axios = require('axios');
const { query } = require('../db/postgres');

const sendNotification = async (eventType, trade) => {
  const channels = ['telegram']; // extend based on settings

  for (const channel of channels) {
    try {
      let message = '';
      switch (eventType) {
        case 'ENTRY_CREATED':
          message = `🟢 BUY ${trade.symbol} @₹${trade.entry_price}\n📊 Scanner: ${trade.scan_name}\n🛑 SL: ₹${trade.sl} | 🎯 Target: ₹${trade.current_target}`;
          break;
        case 'TARGET_HIT':
          message = `🎯 ${trade.symbol} Target Hit!\n💰 Profit: +${trade.pnl_pct}%\n🔄 Trailing SL activated`;
          break;
        case 'STOP_LOSS_HIT':
          message = `🔴 ${trade.symbol} Stop Loss Hit\n📉 Loss: ${trade.pnl_pct}%\n💵 Exit: ₹${trade.exit_price}`;
          break;
        case 'TRAILING':
          message = `📈 ${trade.symbol} Trailing Profit Locked\n✅ Gain: +${trade.pnl_pct}%`;
          break;
      }

      if (channel === 'telegram' && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        });
      }

      await query(`
        INSERT INTO notifications (trade_id, channel, event_type, message, status, sent_at)
        VALUES ($1,$2,$3,$4,'sent',NOW())`,
        [trade.id, channel, eventType, message]
      );
    } catch (err) {
      console.error(`Notification error (${channel}):`, err.message);
      await query(`
        INSERT INTO notifications (trade_id, channel, event_type, message, status, error)
        VALUES ($1,$2,$3,$4,'failed',$5)`,
        [trade.id, channel, eventType, '', err.message]
      );
    }
  }
};

module.exports = { sendNotification };
