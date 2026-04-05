"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = common_vendor.useUserStore();
    const totalIntake = common_vendor.ref(0);
    const totalExercise = common_vendor.ref(0);
    const bmr = common_vendor.ref(0);
    const deficit = common_vendor.ref(0);
    const aiMsg = common_vendor.ref("开始记录你的一天吧！每一小步都是进步。");
    const intakeList = common_vendor.ref([]);
    const exerciseList = common_vendor.ref([]);
    const todayRecords = common_vendor.computed(() => {
      const list = [];
      intakeList.value.forEach((it) => list.push({
        type: "intake",
        name: it.displayText || it.food,
        calories: it.calories,
        time: it.time || ""
      }));
      exerciseList.value.forEach((it) => list.push({
        type: "exercise",
        name: it.displayText || it.activity,
        calories: it.calories,
        time: it.time || ""
      }));
      list.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return b.time.localeCompare(a.time);
      });
      return list;
    });
    const targetDeficit = common_vendor.computed(() => userStore.targetDeficit || 400);
    function drawCircle() {
      const ctx = common_vendor.index.createCanvasContext("deficit-canvas");
      const cx = 80, cy = 80, r = 64;
      const lineW = 12;
      const intake = totalIntake.value || 0;
      const exercise = totalExercise.value || 0;
      const tdee = bmr.value || 0;
      const totalBurn = tdee + exercise;
      const target = targetDeficit.value || 400;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.setStrokeStyle("#eee");
      ctx.setLineWidth(lineW);
      ctx.stroke();
      if (totalBurn > 0) {
        const intakeRatio = Math.min(intake / totalBurn, 1);
        const startAngle = -Math.PI / 2;
        if (intake < totalBurn) {
          const exerciseRatio = 1 - intakeRatio;
          ctx.beginPath();
          ctx.arc(
            cx,
            cy,
            r,
            startAngle + intakeRatio * 2 * Math.PI,
            startAngle + (intakeRatio + exerciseRatio) * 2 * Math.PI
          );
          ctx.setStrokeStyle("#2ecc71");
          ctx.setLineWidth(lineW);
          ctx.setLineCap("round");
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(
          cx,
          cy,
          r,
          startAngle,
          startAngle + intakeRatio * 2 * Math.PI
        );
        ctx.setStrokeStyle("#e74c3c");
        ctx.setLineWidth(lineW);
        ctx.setLineCap("round");
        ctx.stroke();
        const excess = Math.max(intake - totalBurn, 0);
        if (excess > 0) {
          const excessRatio = Math.min(excess / totalBurn, 1);
          ctx.beginPath();
          ctx.arc(
            cx,
            cy,
            r,
            startAngle,
            startAngle + excessRatio * 2 * Math.PI
          );
          ctx.setStrokeStyle("#8e1a1a");
          ctx.setLineWidth(lineW);
          ctx.setLineCap("round");
          ctx.stroke();
        }
        const targetIntake = totalBurn - target;
        if (targetIntake > 0 && targetIntake < totalBurn) {
          const angle = startAngle + targetIntake / totalBurn * 2 * Math.PI;
          const mx = cx + Math.cos(angle) * r;
          const my = cy + Math.sin(angle) * r;
          ctx.save();
          ctx.translate(mx, my);
          ctx.rotate(angle + Math.PI / 2);
          ctx.setFillStyle("#3498db");
          ctx.fillRect(-3, -7, 6, 14);
          ctx.restore();
        }
      }
      ctx.draw();
    }
    common_vendor.watch([totalIntake, totalExercise, bmr, targetDeficit], () => {
      common_vendor.nextTick$1(drawCircle);
    });
    const quickBtns = [
      { label: "早餐", action: "breakfast" },
      { label: "午餐", action: "lunch" },
      { label: "晚餐", action: "dinner" },
      { label: "运动", action: "exercise" }
    ];
    async function loadToday() {
      try {
        const data = await common_vendor.recordApi.getByDate();
        totalIntake.value = data.totalIntake || 0;
        totalExercise.value = data.totalExercise || 0;
        deficit.value = data.deficit || 0;
        bmr.value = data.bmr || userStore.bmr;
        intakeList.value = data.intake || [];
        exerciseList.value = data.exercise || [];
        userStore.setTodayRecord(data);
      } catch (e) {
        bmr.value = userStore.bmr;
      }
      common_vendor.encourageApi.getToday().then((res) => {
        aiMsg.value = res.message;
      }).catch(() => {
      });
    }
    function goRecord(action) {
      common_vendor.index.switchTab({ url: "/src/pages/record/index" });
      common_vendor.index.setStorageSync("quickAction", action);
    }
    common_vendor.onShow(loadToday);
    common_vendor.onMounted(() => {
      loadToday();
      common_vendor.nextTick$1(drawCircle);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(Math.round(deficit.value)),
        b: common_vendor.t(targetDeficit.value),
        c: common_vendor.t(Math.round(totalIntake.value)),
        d: common_vendor.t(Math.round(totalExercise.value)),
        e: common_vendor.t(Math.round(bmr.value)),
        f: common_vendor.t(aiMsg.value),
        g: common_vendor.f(quickBtns, (btn, k0, i0) => {
          return {
            a: common_vendor.t(btn.label),
            b: btn.action,
            c: common_vendor.o(($event) => goRecord(btn.action), btn.action)
          };
        }),
        h: todayRecords.value.length === 0
      }, todayRecords.value.length === 0 ? {} : {
        i: common_vendor.f(todayRecords.value, (item, i, i0) => {
          return {
            a: common_vendor.t(item.type === "intake" ? "🍜" : "🏃"),
            b: common_vendor.n(item.type),
            c: common_vendor.t(item.name),
            d: common_vendor.t(item.time || "刚刚"),
            e: common_vendor.t(item.type === "intake" ? "+" : "-"),
            f: common_vendor.t(item.calories),
            g: common_vendor.n(item.type),
            h: i
          };
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2c5296db"]]);
wx.createPage(MiniProgramPage);
