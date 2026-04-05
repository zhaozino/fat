"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = common_vendor.useUserStore();
    const quickDays = common_vendor.ref(7);
    const startDate = common_vendor.ref("");
    const endDate = common_vendor.ref("");
    const records = common_vendor.ref([]);
    const summary = common_vendor.ref({ avgDeficit: 0, achieveDays: 0, totalDeficit: 0, estWeightLoss: "0.00" });
    function fmtDate(d) {
      return d.toISOString().slice(0, 10);
    }
    function selectQuick(days) {
      quickDays.value = days;
      const today = /* @__PURE__ */ new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - days + 1);
      startDate.value = fmtDate(start);
      endDate.value = fmtDate(today);
      loadStats();
    }
    function onStartChange(e) {
      startDate.value = e.detail.value;
      quickDays.value = 0;
      loadStats();
    }
    function onEndChange(e) {
      endDate.value = e.detail.value;
      quickDays.value = 0;
      loadStats();
    }
    async function loadStats() {
      if (!startDate.value || !endDate.value) return;
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);
      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(fmtDate(d));
      }
      const results = await Promise.allSettled(
        dates.map((date) => common_vendor.recordApi.getByDate(date))
      );
      const rs = results.map((r, i) => ({
        date: dates[i],
        totalIntake: r.status === "fulfilled" ? r.value.totalIntake || 0 : 0,
        totalExercise: r.status === "fulfilled" ? r.value.totalExercise || 0 : 0,
        deficit: r.status === "fulfilled" ? r.value.deficit || 0 : 0
      }));
      records.value = rs;
      const target = userStore.targetDeficit;
      const total = rs.reduce((s, r) => s + r.deficit, 0);
      const achieved = rs.filter((r) => r.deficit >= target * 0.8).length;
      summary.value = {
        avgDeficit: Math.round(total / rs.length),
        achieveDays: achieved,
        totalDeficit: Math.round(total),
        estWeightLoss: common_vendor.estimateWeightLoss(total)
      };
    }
    const historyList = common_vendor.computed(() => {
      const target = userStore.targetDeficit;
      return [...records.value].filter((r) => r.totalIntake > 0).reverse().map((r) => {
        const d = new Date(r.date);
        return {
          ...r,
          dateLabel: `${d.getMonth() + 1}月${d.getDate()}日`,
          achieved: r.deficit >= target
        };
      });
    });
    function drawChart() {
      const rs = records.value;
      const ctx = common_vendor.index.createCanvasContext("deficit-chart");
      const W = 330, H = 200;
      const pad = { top: 20, right: 15, bottom: 30, left: 40 };
      const cw = W - pad.left - pad.right;
      const ch = H - pad.top - pad.bottom;
      ctx.clearRect(0, 0, W, H);
      if (rs.length === 0) {
        ctx.draw();
        return;
      }
      const target = userStore.targetDeficit || 400;
      const deficits = rs.map((r) => r.deficit || 0);
      const maxD = Math.max(...deficits, target, 500);
      const range = maxD || 1;
      const barW = cw / rs.length;
      const gap = Math.max(2, barW * 0.2);
      const bw = Math.max(6, barW - gap);
      ctx.setStrokeStyle("#eee");
      ctx.setLineWidth(1);
      ctx.setFillStyle("#7f8c8d");
      ctx.setFontSize(10);
      ctx.setTextAlign("right");
      for (let i = 0; i <= 4; i++) {
        const y = pad.top + ch / 4 * i;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        const val = Math.round(maxD - range / 4 * i);
        ctx.fillText(String(val), pad.left - 5, y + 4);
      }
      rs.forEach((r, i) => {
        const x = pad.left + barW * i + (barW - bw) / 2;
        const d = r.deficit || 0;
        const h = Math.max(2, d / range * ch);
        const y = pad.top + ch - h;
        const color = d >= target ? "#2ecc71" : d > 0 ? "#f39c12" : "#bdc3c7";
        ctx.setFillStyle(color);
        ctx.fillRect(x, y, bw, h);
      });
      const ty = pad.top + ch - target / range * ch;
      ctx.setStrokeStyle("#e74c3c");
      ctx.setLineWidth(2);
      ctx.setLineDash && ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(pad.left, ty);
      ctx.lineTo(W - pad.right, ty);
      ctx.stroke();
      ctx.setLineDash && ctx.setLineDash([]);
      ctx.setFillStyle("#e74c3c");
      ctx.setFontSize(11);
      ctx.setTextAlign("right");
      ctx.fillText("目标", W - pad.right, ty - 5);
      ctx.setFillStyle("#7f8c8d");
      ctx.setFontSize(10);
      ctx.setTextAlign("center");
      rs.forEach((r, i) => {
        const x = pad.left + barW * i + barW / 2;
        const d = new Date(r.date);
        ctx.fillText(`${d.getMonth() + 1}/${d.getDate()}`, x, H - 10);
      });
      ctx.draw();
    }
    common_vendor.watch(records, () => {
      common_vendor.nextTick$1(drawChart);
    }, { deep: true });
    common_vendor.onShow(() => {
      if (!startDate.value) selectQuick(7);
      else loadStats();
    });
    common_vendor.onMounted(() => selectQuick(7));
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(startDate.value),
        b: startDate.value,
        c: common_vendor.o(onStartChange),
        d: common_vendor.t(endDate.value),
        e: endDate.value,
        f: common_vendor.o(onEndChange),
        g: common_vendor.f([7, 14, 30], (d, k0, i0) => {
          return {
            a: common_vendor.t(d),
            b: d,
            c: quickDays.value === d ? 1 : "",
            d: common_vendor.o(($event) => selectQuick(d), d)
          };
        }),
        h: common_vendor.t(summary.value.avgDeficit),
        i: common_vendor.t(summary.value.achieveDays),
        j: common_vendor.t(summary.value.totalDeficit),
        k: common_vendor.t(summary.value.estWeightLoss),
        l: historyList.value.length === 0
      }, historyList.value.length === 0 ? {} : {}, {
        m: common_vendor.f(historyList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.dateLabel),
            b: item.achieved
          }, item.achieved ? {} : {}, {
            c: common_vendor.t(Math.round(item.totalIntake)),
            d: common_vendor.t(Math.round(item.totalExercise)),
            e: common_vendor.t(Math.round(item.deficit)),
            f: item.date
          });
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-774cec60"]]);
wx.createPage(MiniProgramPage);
