"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = common_vendor.useUserStore();
    const phone = common_vendor.ref("");
    const code = common_vendor.ref("");
    const codeSent = common_vendor.ref(false);
    const submitting = common_vendor.ref(false);
    const countdown = common_vendor.ref(0);
    const tip = common_vendor.ref("");
    const tipType = common_vendor.ref("");
    let timer = null;
    function onPhoneInput(e) {
      phone.value = e.detail.value.replace(/\D/g, "").slice(0, 11);
    }
    function showTip(msg, type = "error") {
      tip.value = msg;
      tipType.value = type;
    }
    function startCountdown(sec = 60) {
      countdown.value = sec;
      timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1e3);
    }
    async function sendCode() {
      if (!/^1[3-9]\d{9}$/.test(phone.value)) {
        return showTip("请输入正确的11位手机号");
      }
      try {
        submitting.value = true;
        await common_vendor.authApi.sendSms(phone.value);
        codeSent.value = true;
        startCountdown();
        const masked = phone.value.slice(0, 3) + "****" + phone.value.slice(7);
        showTip(`验证码已发送至 ${masked}`, "info");
      } finally {
        submitting.value = false;
      }
    }
    async function onSubmit() {
      if (!codeSent.value) {
        return sendCode();
      }
      if (code.value.length !== 6) {
        return showTip("请输入6位验证码");
      }
      try {
        submitting.value = true;
        const res = await common_vendor.authApi.verify(phone.value, code.value);
        userStore.setToken(res.token);
        await userStore.loadProfile();
        if (res.isNewUser) {
          common_vendor.index.reLaunch({ url: "/src/pages/profile/index?newUser=1" });
        } else {
          common_vendor.index.reLaunch({ url: "/src/pages/home/index" });
        }
      } catch (e) {
        showTip(e.message || "验证失败，请重试");
        submitting.value = false;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o([($event) => phone.value = $event.detail.value, onPhoneInput]),
        b: phone.value,
        c: codeSent.value
      }, codeSent.value ? common_vendor.e({
        d: code.value,
        e: common_vendor.o(($event) => code.value = $event.detail.value),
        f: common_vendor.t(countdown.value > 0 ? `${countdown.value}s后重发` : "重新获取"),
        g: countdown.value > 0,
        h: common_vendor.o(sendCode),
        i: tip.value
      }, tip.value ? {
        j: common_vendor.t(tip.value),
        k: common_vendor.n(tipType.value)
      } : {}) : {}, {
        l: common_vendor.t(submitting.value ? "处理中…" : codeSent.value ? "登录 / 注册" : "获取验证码"),
        m: submitting.value,
        n: common_vendor.o(onSubmit)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-45258083"]]);
wx.createPage(MiniProgramPage);
