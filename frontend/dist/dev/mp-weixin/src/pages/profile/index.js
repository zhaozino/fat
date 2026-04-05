"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = common_vendor.useUserStore();
    const saving = common_vendor.ref(false);
    const bmrValue = common_vendor.ref(0);
    const form = common_vendor.ref({
      gender: "male",
      height: "",
      weight: "",
      age: "",
      activityLevel: 1.55,
      targetDeficit: 400
    });
    const activityOptions = [
      { label: "久坐（几乎不运动）", value: 1.2 },
      { label: "轻度活动（每周1-3天）", value: 1.375 },
      { label: "中度活动（每周3-5天）", value: 1.55 },
      { label: "高度活动（每周6-7天）", value: 1.725 },
      { label: "非常高强度（体力劳动）", value: 1.9 }
    ];
    const activityIndex = common_vendor.computed(
      () => activityOptions.findIndex((o) => o.value === form.value.activityLevel) || 2
    );
    function onActivityChange(e) {
      form.value.activityLevel = activityOptions[e.detail.value].value;
    }
    const maskedPhone = common_vendor.computed(() => {
      var _a;
      const p = ((_a = userStore.profile) == null ? void 0 : _a.phone) || "";
      return p ? p.slice(0, 3) + "****" + p.slice(7) : "未登录";
    });
    async function loadProfile() {
      try {
        const data = await common_vendor.userApi.getProfile();
        if (data.gender) form.value.gender = data.gender;
        if (data.height) form.value.height = data.height;
        if (data.weight) form.value.weight = data.weight;
        if (data.age) form.value.age = data.age;
        if (data.activityLevel) form.value.activityLevel = data.activityLevel;
        if (data.targetDeficit) form.value.targetDeficit = data.targetDeficit;
        bmrValue.value = data.bmr || 0;
      } catch (e) {
      }
    }
    async function saveProfile() {
      saving.value = true;
      try {
        const data = await common_vendor.userApi.saveProfile({
          ...form.value,
          height: Number(form.value.height),
          weight: Number(form.value.weight),
          age: Number(form.value.age),
          targetDeficit: Number(form.value.targetDeficit)
        });
        bmrValue.value = data.bmr || 0;
        userStore.profile = data;
        common_vendor.index.showToast({ title: "保存成功", icon: "success" });
      } catch (e) {
      } finally {
        saving.value = false;
      }
    }
    function exportData() {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    }
    function clearData() {
      common_vendor.index.showModal({
        title: "确认清除",
        content: "将清除所有本地数据，此操作不可撤销",
        success(res) {
          if (res.confirm) {
            common_vendor.index.showToast({ title: "已清除", icon: "success" });
          }
        }
      });
    }
    function logout() {
      common_vendor.index.showModal({
        title: "退出登录",
        content: "确定要退出登录吗？",
        success(res) {
          if (res.confirm) userStore.logout();
        }
      });
    }
    common_vendor.onShow(loadProfile);
    common_vendor.onMounted(loadProfile);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(maskedPhone.value),
        b: form.value.gender === "male" ? 1 : "",
        c: common_vendor.o(($event) => form.value.gender = "male"),
        d: form.value.gender === "female" ? 1 : "",
        e: common_vendor.o(($event) => form.value.gender = "female"),
        f: form.value.height,
        g: common_vendor.o(($event) => form.value.height = $event.detail.value),
        h: form.value.weight,
        i: common_vendor.o(($event) => form.value.weight = $event.detail.value),
        j: form.value.age,
        k: common_vendor.o(($event) => form.value.age = $event.detail.value),
        l: common_vendor.t(activityOptions[activityIndex.value].label),
        m: activityOptions,
        n: activityIndex.value,
        o: common_vendor.o(onActivityChange),
        p: form.value.targetDeficit,
        q: common_vendor.o(($event) => form.value.targetDeficit = $event.detail.value),
        r: common_vendor.t(saving.value ? "保存中…" : "保存信息"),
        s: saving.value,
        t: common_vendor.o(saveProfile),
        v: bmrValue.value
      }, bmrValue.value ? {
        w: common_vendor.t(Math.round(bmrValue.value))
      } : {}, {
        x: common_vendor.o(exportData),
        y: common_vendor.o(clearData),
        z: common_vendor.o(logout)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f97f9319"]]);
wx.createPage(MiniProgramPage);
