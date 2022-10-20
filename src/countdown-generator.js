"use strict";

const fs = require("fs");
// const path = require("path");
const GIFEncoder = require("gifencoder");
const { registerFont, createCanvas } = require("canvas");
const moment = require("moment");

const ZOOM_FACTOR = 2;

const GAP = 10 * ZOOM_FACTOR;
const TEXT_CELL_BIG = { w: 102.5 * ZOOM_FACTOR, h: 73 * ZOOM_FACTOR };
const TEXT_CELL_SMALL = { w: 102.5 * ZOOM_FACTOR, h: 17 * ZOOM_FACTOR };

// const line = (x1, y1, x2, y2, color, ctx) => {
//   ctx.beginPath();
//   ctx.moveTo(x1, y1);
//   ctx.lineTo(x2, y2);
//   ctx.strokeStyle = color;
//   ctx.stroke();
// };

function fillTextWithSpacing(context, text, x, y, spacing) {
  const total_width =
    context.measureText(text).width + spacing * (text.length - 1);

  const align = context.textAlign;
  context.textAlign = "left";

  switch (align) {
    case "right":
      x -= total_width;
      break;
    case "center":
      x -= total_width / 2;
      break;
  }

  let offset,
    pair_width,
    char_width,
    char_next_width,
    pair_spacing,
    char,
    char_next;

  for (offset = 0; offset < text.length; offset = offset + 1) {
    char = text.charAt(offset);
    pair_spacing = 0;
    if (offset + 1 < text.length) {
      char_next = text.charAt(offset + 1);
      pair_width = context.measureText(char + char_next).width;
      char_width = context.measureText(char).width;
      char_next_width = context.measureText(char_next).width;
      pair_spacing = pair_width - char_width - char_next_width;
    }

    context.fillText(char, x, y);
    x = x + char_width + pair_spacing + spacing;
  }

  context.textAlign = align;
}

module.exports = {
  /**
   * Initialise the GIF generation
   * @param {string} time
   * @param {number} width
   * @param {number} height
   * @param {string} color
   * @param {string} bg
   * @param {string} name
   * @param {number} frames
   * @param {requestCallback} cb - The callback that is run once complete.
   */
  init: function (
    time,
    width = 500,
    height = 150,
    color = "2B2B2C",
    bg = "F8F4EF",
    name = "countdown",
    frames = 15,
    cb,
  ) {
    // Set some sensible upper / lower bounds
    this.width = this.clamp(width * ZOOM_FACTOR, 150 * ZOOM_FACTOR, 500 * ZOOM_FACTOR);
    this.height = this.clamp(height * ZOOM_FACTOR, 150 * ZOOM_FACTOR, 500 * ZOOM_FACTOR);
    this.frames = this.clamp(frames, 1, 90);

    this.bg = "#" + bg;
    this.textColor = "#" + color;
    this.name = name;

    // loop optimisations
    this.halfWidth = Number(this.width / 2);
    this.halfHeight = Number(this.height / 2);

    this.encoder = new GIFEncoder(this.width, this.height);
    registerFont('src/Acronym-Regular.ttf', { family: 'Acronym-Regular' })
    registerFont('src/Acronym-Semibold.ttf', { family: 'Acronym-Semibold' })

    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext("2d");

    // calculate the time difference (if any)
    let timeResult = this.time(time);

    // start the gif encoder
    this.encode(timeResult, cb);
  },
  /**
   * Limit a value between a min / max
   * @link http://stackoverflow.com/questions/11409895/whats-the-most-elegant-way-to-cap-a-number-to-a-segment
   * @param number - input number
   * @param min - minimum value number can have
   * @param max - maximum value number can have
   * @returns {number}
   */
  clamp: function (number, min, max) {
    return Math.max(min, Math.min(number, max));
  },
  /**
   * Calculate the diffeence between timeString and current time
   * @param {string} timeString
   * @returns {string|Object} - return either the date passed string, or a valid moment duration object
   */
  time: function (timeString) {
    // grab the current and target time
    let target = moment(timeString);
    let current = moment();

    // difference between the 2 (in ms)
    let difference = target.diff(current);

    // either the date has passed, or we have a difference
    if (difference <= 0) {
      return "Date has passed!";
    } else {
      // duration of the difference
      return moment.duration(difference);
    }
  },
  /**
   * Encode the GIF with the information provided by the time function
   * @param {string|Object} timeResult - either the date passed string, or a valid moment duration object
   * @param {requestCallback} cb - the callback to be run once complete
   */
  encode: function (timeResult, cb) {
    let enc = this.encoder;
    let ctx = this.ctx;
    let tmpDir = process.cwd() + "/tmp/";

    // create the tmp directory if it doesn't exist
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    let filePath = tmpDir + this.name + ".gif";

    // pipe the image to the filesystem to be written
    let imageStream = enc
      .createReadStream()
      .pipe(fs.createWriteStream(filePath));
    // once finised, generate or serve
    imageStream.on("finish", () => {
      // only execute callback if it is a function
      typeof cb === "function" && cb();
    });

    // estimate the font size based on the provided width
    let fontSize = `${60 * ZOOM_FACTOR}px`;
    let fontFamily = "Acronym-Regular";

    // set the font style
    ctx.font = [fontSize, fontFamily].join(" ");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // start encoding gif with following settings
    enc.start();
    enc.setRepeat(0);
    enc.setDelay(1000);
    enc.setQuality(10);

    // if we have a moment duration object
    if (typeof timeResult === "object") {
      for (let i = 0; i < this.frames; i++) {
        // extract the information we need from the duration
        let days = Math.floor(timeResult.asDays());
        let hours = Math.floor(timeResult.asHours() - days * 24);
        let minutes =
          Math.floor(timeResult.asMinutes()) - days * 24 * 60 - hours * 60;
        let seconds =
          Math.floor(timeResult.asSeconds()) -
          days * 24 * 60 * 60 -
          hours * 60 * 60 -
          minutes * 60;

        // make sure we have at least 2 characters in the string
        days = days.toString().length == 1 ? "0" + days : days;
        hours = hours.toString().length == 1 ? "0" + hours : hours;
        minutes = minutes.toString().length == 1 ? "0" + minutes : minutes;
        seconds = seconds.toString().length == 1 ? "0" + seconds : seconds;

        // paint BG
        ctx.fillStyle = this.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // const hw = this.halfWidth;
        // const w = this.width;
        const h = this.height;
        const hh = this.halfHeight;
        // const c = this.textColor;

        // line(hw, 0, hw, h, c, ctx);
        // line(0, hh, w, hh, c, ctx);

        // paint text
        ctx.fillStyle = this.textColor;
        ctx.textAlign = "center";

        const labels = ["DAYS", "HOURS", "MINUTES", "SECONDS"];

        [days, hours, minutes, seconds].forEach((time, colIndex) => {
          const x = (75 * ZOOM_FACTOR) + TEXT_CELL_BIG.w * colIndex + GAP * colIndex;
          const bigY = hh - GAP;
          const colH = TEXT_CELL_BIG.h + GAP + TEXT_CELL_SMALL.h;
          const smallY = (h - colH) / 2 + colH - TEXT_CELL_SMALL.h;

          ctx.font = `${60 * ZOOM_FACTOR}px Acronym-Regular`;
          ctx.fillText(time, x, bigY, TEXT_CELL_BIG.w);

          const smallFontSize = 12 * ZOOM_FACTOR;
          ctx.font = `${smallFontSize}px Acronym-Semibold`;
          fillTextWithSpacing(
            ctx,
            labels[colIndex],
            x,
            smallY,
            0.2 * smallFontSize
          );
        });

        // add finalised frame to the gif
        enc.addFrame(ctx);

        ctx.moveTo(0, 0);

        // remove a second for the next loop
        timeResult.subtract(1, "seconds");
      }
    } else {
      // Date has passed so only using a string

      // BG
      ctx.fillStyle = this.bg;
      ctx.fillRect(0, 0, this.width, this.height);

      // Text
      ctx.fillStyle = this.textColor;
      ctx.fillText(timeResult, this.halfWidth, this.halfHeight);
      enc.addFrame(ctx);
    }

    // finish the gif
    enc.finish();
  },
};
