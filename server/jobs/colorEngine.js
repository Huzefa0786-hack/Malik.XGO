const ColorRound =
require(
  "../models/ColorRound"
);

setInterval(
  async () => {

    const number =
      Math.floor(
        Math.random() * 10
      );

    let color =
      "GREEN";

    if (
      [2,4,6,8]
      .includes(number)
    ) {

      color = "RED";

    }

    if (
      number === 0 ||
      number === 5
    ) {

      color =
        "VIOLET";

    }

    await ColorRound.create({

      period:
        Date.now(),

      resultNumber:
        number,

      resultColor:
        color,

    });

  },
  30000
);