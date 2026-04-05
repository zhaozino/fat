"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const messages = common_vendor.ref([]);
    const inputText = common_vendor.ref("");
    const loading = common_vendor.ref(false);
    const scrollTop = common_vendor.ref(0);
    let msgId = 0;
    function addMsg(role, text, imageUrl = null) {
      messages.value.push({ id: ++msgId, role, text, imageUrl });
      common_vendor.nextTick$1(() => {
        scrollTop.value = 99999;
      });
    }
    async function onSend() {
      const text = inputText.value.trim();
      if (!text) return;
      inputText.value = "";
      addMsg("user", text);
      await parseAndSave(text, null);
    }
    async function onCamera() {
      common_vendor.index.chooseImage({
        count: 1,
        sourceType: ["camera", "album"],
        success: async (res) => {
          const tempPath = res.tempFilePaths[0];
          loading.value = true;
          addMsg("user", inputText.value || "", tempPath);
          try {
            const token = await common_vendor.fileApi.getUploadToken();
            const cosUrl = await common_vendor.fileApi.uploadToCos(token, tempPath);
            const text = inputText.value.trim() || null;
            inputText.value = "";
            await parseAndSave(text, cosUrl);
          } catch (e) {
            loading.value = false;
            addMsg("ai", "图片上传失败，请重试");
          }
        }
      });
    }
    async function parseAndSave(text, imageUrl) {
      loading.value = true;
      try {
        const mealType = getMealType();
        const parsed = await common_vendor.parseApi.parse(text, imageUrl, mealType);
        const saved = await common_vendor.recordApi.save({
          type: parsed.type,
          name: parsed.name,
          calories: parsed.calories,
          displayText: parsed.displayText,
          isEstimated: parsed.isEstimated,
          mealType,
          imageUrl: imageUrl || null
        });
        const tag = parsed.isEstimated ? "（估算）" : "";
        const label = parsed.type === "exercise" ? `已记录运动「${parsed.name}」，消耗约 ${Math.round(parsed.calories)} 大卡${tag}` : `已记录「${parsed.name}」，约 ${Math.round(parsed.calories)} 大卡${tag}`;
        addMsg("ai", label + `
今日缺口：${Math.round(saved.deficit)} 大卡`);
      } catch (e) {
        addMsg("ai", "记录失败，请重试");
      } finally {
        loading.value = false;
      }
    }
    function getMealType() {
      const h = (/* @__PURE__ */ new Date()).getHours();
      if (h < 10) return "breakfast";
      if (h < 14) return "lunch";
      if (h < 20) return "dinner";
      return "snack";
    }
    common_vendor.onShow(() => {
      const action = common_vendor.index.getStorageSync("quickAction");
      if (action) {
        common_vendor.index.removeStorageSync("quickAction");
        const map = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", exercise: "运动" };
        inputText.value = map[action] || "";
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(messages.value, (msg, k0, i0) => {
          return common_vendor.e({
            a: msg.role === "ai"
          }, msg.role === "ai" ? {} : {}, {
            b: msg.imageUrl
          }, msg.imageUrl ? common_vendor.e({
            c: msg.imageUrl,
            d: msg.text
          }, msg.text ? {
            e: common_vendor.t(msg.text)
          } : {}) : {
            f: common_vendor.t(msg.text),
            g: common_vendor.n(msg.role + "-bubble")
          }, {
            h: msg.role === "user"
          }, msg.role === "user" ? {} : {}, {
            i: msg.id,
            j: common_vendor.n(msg.role)
          });
        }),
        b: loading.value
      }, loading.value ? {} : {}, {
        c: scrollTop.value,
        d: common_assets._imports_0,
        e: common_vendor.o(onCamera),
        f: common_vendor.o(onSend),
        g: inputText.value,
        h: common_vendor.o(($event) => inputText.value = $event.detail.value),
        i: common_assets._imports_1,
        j: common_vendor.o(onSend)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e218755a"]]);
wx.createPage(MiniProgramPage);
