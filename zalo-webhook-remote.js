var http = require('http');
var execSync = require('child_process').execSync;
var fs = require('fs');

var PORT = 3456;
var OPENCLAW = '/home/molt/.npm-global/bin/openclaw';
var ZALO_GROUP = 'group:2069484793216742236';
var SECRET = 'tramdungchill2026';

// Multi-brand tokens files (key = brand slug)
var ZALO_OA_TOKENS_FILES = {
  'xom-leo': '/home/molt/zalo-oa-refresh/tokens.json',
  'tdc':     '/home/molt/zalo-oa-refresh-tdc/tokens.json'
};
var DEFAULT_BRAND = 'xom-leo'; // backward compat for old callers

function sendZaloMessage(msg) {
  var tmpFile = '/tmp/zalo_msg_' + Date.now() + '.txt';
  fs.writeFileSync(tmpFile, msg, 'utf8');
  var cmd = "sudo -u molt bash -c '" + OPENCLAW + " message send --channel zalouser --target " + ZALO_GROUP + ' --message "$(cat ' + tmpFile + ')"' + "'";
  var result = execSync(cmd, { timeout: 15000 }).toString();
  try { fs.unlinkSync(tmpFile); } catch(e) {}
  return result;
}

var server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // === DAT BAN MOI ===
  if (req.method === 'POST' && req.url === '/webhook/zalo-booking') {
    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        var data = JSON.parse(body);

        if (data.secret !== SECRET) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }

        var occasionMap = {
          'birthday': 'Sinh nhat',
          'anniversary': 'Ky niem',
          'date': 'Hen ho',
          'gathering': 'Hop mat ban be',
          'company': 'Cong ty / team',
          'other': 'Khac'
        };

        var nguonMap = {
          'direct': 'Truc tiep',
          'facebook': 'Facebook Ads',
          'facebook_organic': 'Facebook',
          'tiktok': 'TikTok',
          'google_organic': 'Google',
          'zalo': 'Zalo'
        };

        var lines = [];
        lines.push('🔔 DAT BAN MOI');
        lines.push('');
        lines.push('👤 Ten: ' + (data.name || ''));
        lines.push('📱 SDT: ' + (data.phone || ''));
        lines.push('📅 Ngay: ' + (data.date || ''));
        lines.push('⏰ Gio: ' + (data.time || ''));
        lines.push('👥 So khach: ' + (data.guests || ''));
        if (data.occasion) lines.push('🎉 Dip: ' + (occasionMap[data.occasion] || data.occasion));
        if (data.note) lines.push('📝 Ghi chu: ' + data.note);
        var src = data.source || 'direct';
        lines.push('📢 Nguon: ' + (nguonMap[src] || src));
        lines.push('');
        lines.push('Dat qua website tramdungchill.vn');
        var msg = lines.join('\n');

        var result = sendZaloMessage(msg);

        console.log(new Date().toISOString(), 'Booking sent:', result.trim());
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, result: result.trim() }));
      } catch (err) {
        console.error(new Date().toISOString(), 'Booking error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });

  // === TONG KET CUOI NGAY ===
  } else if (req.method === 'POST' && req.url === '/webhook/zalo-summary') {
    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        var data = JSON.parse(body);

        if (data.secret !== SECRET) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }

        var lines = [];
        lines.push('📊 TONG HOP NGAY ' + (data.date || ''));
        lines.push('');
        lines.push('📋 Tong don: ' + (data.totalBookings || 0));
        lines.push('👥 Tong khach: ' + (data.totalGuests || 0));

        if (data.sourceBreakdown) {
          lines.push('');
          lines.push('📢 Theo nguon:');
          var sources = data.sourceBreakdown;
          for (var src in sources) {
            lines.push('  • ' + src + ': ' + sources[src] + ' don');
          }
        }

        if (data.details && data.details.length > 0) {
          lines.push('');
          lines.push('Chi tiet:');
          for (var i = 0; i < data.details.length; i++) {
            var d = data.details[i];
            lines.push((i + 1) + '. ' + d.name + ' - ' + d.guests + ' khach - ' + d.time);
          }
        }

        if (data.totalBookings === 0) {
          lines.push('');
          lines.push('Khong co don dat ban nao hom nay.');
        }

        var msg = lines.join('\n');
        var result = sendZaloMessage(msg);

        console.log(new Date().toISOString(), 'Summary sent:', result.trim());
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, result: result.trim() }));
      } catch (err) {
        console.error(new Date().toISOString(), 'Summary error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });

  // === GET ZALO OA ACCESS TOKEN (multi-brand, for Apps Script) ===
  // POST /webhook/get-zalo-token with { secret, brand: "xom-leo" | "tdc" }
  // brand optional, defaults to "xom-leo" for backward compat
  } else if (req.method === 'POST' && req.url === '/webhook/get-zalo-token') {
    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        var data = JSON.parse(body);

        if (data.secret !== SECRET) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
          return;
        }

        var brand = (data.brand || DEFAULT_BRAND).toLowerCase();
        var tokensFile = ZALO_OA_TOKENS_FILES[brand];
        if (!tokensFile) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Unknown brand: ' + brand + '. Available: ' + Object.keys(ZALO_OA_TOKENS_FILES).join(', ') }));
          return;
        }

        if (!fs.existsSync(tokensFile)) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Tokens file not found for brand ' + brand + ' (' + tokensFile + '). Setup auto-refresh first.' }));
          return;
        }

        var tokens = JSON.parse(fs.readFileSync(tokensFile, 'utf8'));
        var expiresAt = new Date(tokens.access_token_expires_at || 0).getTime();
        var now = Date.now();
        var validForSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          brand: tokens.brand || brand,
          access_token: tokens.access_token,
          app_id: tokens.app_id,
          expires_at: tokens.access_token_expires_at,
          valid_for_seconds: validForSeconds
        }));
        console.log(new Date().toISOString(), 'Token served for', brand, 'valid for', validForSeconds, 's');
      } catch (err) {
        console.error(new Date().toISOString(), 'Token endpoint error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });

  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('Zalo Booking Webhook running on port ' + PORT);
});
