/* PeerLink: minimal WebRTC data-channel connector with manual, copy-paste
   signaling — no server, no accounts. One player hosts (creates an offer
   code), the other joins (pastes it, gets back an answer code), the host
   pastes that back in, and the two browsers talk directly from then on.

   Only public STUN servers are contacted (just enough for NAT traversal;
   they see connection metadata, never game data). There is no TURN relay,
   so a connection can fail to establish on strict/symmetric NATs (common
   on some corporate or school networks) — that shows up as the "Connect"
   step never finishing. */

window.PeerLink = (() => {
  const RTC_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  function encode(desc) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(desc))));
  }
  function decode(code) {
    return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  }

  // Non-trickle ICE: wait for gathering to finish (or 4s, whichever first)
  // so the whole connection offer/answer fits in one copy-pasted code.
  function waitForIce(pc) {
    if (pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { pc.removeEventListener("icegatheringstatechange", done); resolve(); };
      pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") done(); });
      setTimeout(done, 4000);
    });
  }

  function wireChannel(channel, handlers) {
    channel.addEventListener("open", () => handlers.onOpen && handlers.onOpen());
    channel.addEventListener("close", () => handlers.onClose && handlers.onClose());
    channel.addEventListener("error", () => handlers.onClose && handlers.onClose());
    channel.addEventListener("message", (e) => {
      if (handlers.onMessage) { try { handlers.onMessage(JSON.parse(e.data)); } catch (err) { /* ignore malformed */ } }
    });
  }

  function host(handlers = {}) {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    const channel = pc.createDataChannel("game");
    wireChannel(channel, handlers);
    pc.addEventListener("connectionstatechange", () => handlers.onState && handlers.onState(pc.connectionState));

    const codePromise = pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => waitForIce(pc))
      .then(() => encode(pc.localDescription));

    return {
      codePromise,
      acceptAnswer: (code) => pc.setRemoteDescription(decode(code)),
      send: (obj) => { if (channel.readyState === "open") channel.send(JSON.stringify(obj)); },
      close: () => { try { channel.close(); } catch (e) {} try { pc.close(); } catch (e) {} },
    };
  }

  function join(offerCode, handlers = {}) {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    let channel = null;
    pc.addEventListener("datachannel", (e) => { channel = e.channel; wireChannel(channel, handlers); });
    pc.addEventListener("connectionstatechange", () => handlers.onState && handlers.onState(pc.connectionState));

    const codePromise = pc.setRemoteDescription(decode(offerCode))
      .then(() => pc.createAnswer())
      .then((answer) => pc.setLocalDescription(answer))
      .then(() => waitForIce(pc))
      .then(() => encode(pc.localDescription));

    return {
      codePromise,
      send: (obj) => { if (channel && channel.readyState === "open") channel.send(JSON.stringify(obj)); },
      close: () => { try { if (channel) channel.close(); } catch (e) {} try { pc.close(); } catch (e) {} },
    };
  }

  return { host, join, supported: typeof RTCPeerConnection !== "undefined" };
})();
