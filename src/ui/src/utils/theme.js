export const getThemeForRoute = (route) => {
  if (route.endsWith("hki")) {
    return {
      colors: {
        primary: "#FF0000",
        secondary: "#00FF00",
        button: "#414042",
        gradient: "bg-gradient-to-b from-[#414042] to-[#FCD923]",
      },
      logo: {
        path: "/Images/hki_logo.png",
      },
      height: "105",
      width: "105",
    };
  } else if (route.endsWith("maxion-wheels")) {
    return {
      colors: {
        primary: "#0000FF",
        secondary: "#FF00FF",
        button: "#EE782F",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#EE782F]",
      },
      logo: {
        path: "/Images/mw_logo.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("reddyice")) {
    return {
      colors: {
        primary: "#DA291C",
        secondary: "#0082BA",
        button: "#DA291C",
        gradient: "bg-gradient-to-b from-[#0082BA] to-[#DA291C]",
      },
      logo: {
        path: "/Images/reddyice.jpeg",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("tgcs")) {
    return {
      colors: {
        primary: "#0000FF",
        secondary: "#FF00FF",
        button: "#242424",
        gradient: "bg-gradient-to-b from-[#242424] to-[#ED1529]",
      },
      logo: {
        path: "/Images/toshiba.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("altice")) {
    return {
      colors: {
        primary: "#FFFFFF",
        secondary: "#000000",
        button: "#aaaaaa",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#aaaaaa]",
      },
      logo: {
        path: "/Images/Altice.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("fresenius")) {
    return {
      colors: {
        primary: "#003087",
        secondary: "#FFFFFF",
        button: "#003087",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#003087]",
      },
      logo: {
        path: "/Images/fresenius.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("jcp")) {
    return {
      colors: {
        primary: "#EE2737",
        secondary: "#FFFFFF",
        button: "#EE2737",
        gradient: "bg-gradient-to-b from-[#BA0C2F] to-[#EE2737]",
      },
      logo: {
        path: "/Images/jcpenney.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("jpmorgan")) {
    return {
      colors: {
        primary: "#005EB8",
        secondary: "#000000",
        button: "#005EB8",
        gradient: "bg-gradient-to-b from-[#005EB8] to-[#000000]",
      },
      logo: {
        path: "/Images/jpmorgan.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("aimbridge")) {
    return {
      colors: {
        primary: "#407EC9",
        secondary: "#000000",
        button: "#407EC9",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#407EC9]",
      },
      logo: {
        path: "/Images/aimbridge.jpeg",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("neimanmarcus")) {
    return {
      colors: {
        primary: "#212322",
        secondary: "#FFFFFF",
        button: "#212322",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#212322]",
      },
      logo: {
        path: "/Images/neimanmarcus.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("rexel")) {
    return {
      colors: {
        primary: "#003087",
        secondary: "#418FDE",
        button: "#003087",
        gradient: "bg-gradient-to-b from-[#003087] to-[#418FDE]",
      },
      logo: {
        path: "/Images/rexel.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("topgolf")) {
    return {
      colors: {
        primary: "#004B87",
        secondary: "#FFFFFF",
        button: "#004B87",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#004B87]",
      },
      logo: {
        path: "/Images/topgolf.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("2020")) {
    return {
      colors: {
        primary: "#000000",
        secondary: "#FFFFFF",
        button: "#000000",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#000000]",
      },
      logo: {
        path: "/Images/2020.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("abm")) {
    return {
      colors: {
        primary: "#0057B8",
        secondary: "#FF6900",
        button: "#EE782F",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#0057B8]",
      },
      logo: {
        path: "/Images/abm.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("altair")) {
    return {
      colors: {
        primary: "#003D4C",
        secondary: "#FFFFFF",
        button: "#003D4C",
        gradient: "bg-gradient-to-b from-[#003D4C] to-[#003D4C]",
      },
      logo: {
        path: "/Images/altair.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("calvetti")) {
    return {
      colors: {
        primary: "#009CDE",
        secondary: "#6CC24A",
        button: "#FF7F32",
        gradient: "bg-gradient-to-b from-[#7C878E] to-[#6CC24A]",
      },
      logo: {
        path: "/Images/calvetti.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("atlanticaviation")) {
    return {
      colors: {
        primary: "#00AEC7",
        secondary: "#FFFFFF",
        button: "#00AEC7",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#00AEC7]",
      },
      logo: {
        path: "/Images/atlantic.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("fiestamart")) {
    return {
      colors: {
        primary: "#EE2737",
        secondary: "#00B140",
        button: "#EE2737",
        gradient: "bg-gradient-to-b from-[#EE2737] to-[#00B140]",
      },
      logo: {
        path: "/Images/fiestamart.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("daisybrand")) {
    return {
      colors: {
        primary: "#CB2C30",
        secondary: "#7DA1C4",
        button: "#CB2C30",
        gradient: "bg-gradient-to-b from-[#CB2C30] to-[#7DA1C4]",
      },
      logo: {
        path: "/Images/daisybrand.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("eastport")) {
    return {
      colors: {
        primary: "#003B5C",
        secondary: "#9E652E",
        button: "#EE782F",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#003B5C]",
      },
      logo: {
        path: "/Images/eastport.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("firstcash")) {
    return {
      colors: {
        primary: "#001871",
        secondary: "#E4002B",
        button: "#001871",
        gradient: "bg-gradient-to-b from-[#001871] to-[#E4002B]",
      },
      logo: {
        path: "/Images/firstcash.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("fitnessconnection")) {
    return {
      colors: {
        primary: "#373A36",
        secondary: "#FFFFFF",
        button: "#373A36",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#373A36]",
      },
      logo: {
        path: "/Images/fitnessconnection.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("csgforte")) {
    return {
      colors: {
        primary: "#000000",
        secondary: "#FFFFFF",
        button: "#000000",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#000000]",
      },
      logo: {
        path: "/Images/csgforte.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("globelife")) {
    return {
      colors: {
        primary: "#00587C",
        secondary: "#509E2F",
        button: "#00587C",
        gradient: "bg-gradient-to-b from-[#00587C] to-[#509E2F]",
      },
      logo: {
        path: "/Images/globelife.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("goodwill")) {
    return {
      colors: {
        primary: "#00629B",
        secondary: "#000000",
        button: "#00629B",
        gradient: "bg-gradient-to-b from-[#5BC2E7] to-[#00629B]",
      },
      logo: {
        path: "/Images/goodwill.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("gordonramsay")) {
    return {
      colors: {
        primary: "#FFFFFF",
        secondary: "#000000",
        button: "#000000",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#000000]",
      },
      logo: {
        path: "/Images/gordonramsay.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("highlandhomes")) {
    return {
      colors: {
        primary: "#00263E",
        secondary: "#FFFFFF",
        button: "#00263E",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#00263E]",
      },
      logo: {
        path: "/Images/highlandhomes.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("iqeq")) {
    return {
      colors: {
        primary: "#65665C",
        secondary: "#3CDBC0",
        button: "#3CDBC0",
        gradient: "bg-gradient-to-b from-[#3CDBC0] to-[#65665C]",
      },
      logo: {
        path: "/Images/iqeq.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("kindred")) {
    return {
      colors: {
        primary: "#003C71",
        secondary: "#6CC24A",
        button: "#003C71",
        gradient: "bg-gradient-to-b from-[#003C71] to-[#000000]",
      },
      logo: {
        path: "/Images/kindred.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("marshmclennan")) {
    return {
      colors: {
        primary: "#012169",
        secondary: "#FFFFFF",
        button: "#012169",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#012169]",
      },
      logo: {
        path: "/Images/marshmclennan.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("mcc")) {
    return {
      colors: {
        primary: "#000000",
        secondary: "#69B3E7",
        button: "#00965E",
        gradient: "bg-gradient-to-b from-[#69B3E7] to-[#000000]",
      },
      logo: {
        path: "/Images/mcc.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("michaels")) {
    return {
      colors: {
        primary: "#E4002B",
        secondary: "#FFFFFF",
        button: "#E4002B",
        gradient: "bg-gradient-to-b from-[#E4002B] to-[#E4002B]",
      },
      logo: {
        path: "/Images/michaels.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("moneygram")) {
    return {
      colors: {
        primary: "#DA291C",
        secondary: "#000000",
        button: "#DA291C",
        gradient: "bg-gradient-to-b from-[#DA291C] to-[#000000]",
      },
      logo: {
        path: "/Images/moneygram.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("omni")) {
    return {
      colors: {
        primary: "#00313C",
        secondary: "#000000",
        button: "#00313C",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#00313C]",
      },
      logo: {
        path: "/Images/omni.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("7eleven")) {
    return {
      colors: {
        primary: "#E4002B",
        secondary: "#28724F",
        button: "#EA7600",
        gradient: "bg-gradient-to-b from-[#E4002B] to-[#28724F]",
      },
      logo: {
        path: "/Images/7eleven.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("mclane")) {
    return {
      colors: {
        primary: "#E03C31",
        secondary: "#000000",
        button: "#E03C31",
        gradient: "bg-gradient-to-b from-[#E03C31] to-[#000000]",
      },
      logo: {
        path: "/Images/mclane.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("xerox")) {
    return {
      colors: {
        primary: "#D22630",
        secondary: "#FFFFFF",
        button: "#D22630",
        gradient: "bg-gradient-to-b from-[#D22630] to-[#D22630]",
      },
      logo: {
        path: "/Images/xerox.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("birdeye")) {
    return {
      colors: {
        primary: "#407EC9",
        secondary: "#000000",
        button: "#407EC9",
        gradient: "bg-gradient-to-b from-[#407EC9] to-[#000000]",
      },
      logo: {
        path: "/Images/birdeye.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("advocare")) {
    return {
      colors: {
        primary: "#418FDE",
        secondary: "#FFFFFF",
        button: "#418FDE",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#418FDE]",
      },
      logo: {
        path: "/Images/advocare.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("aecom")) {
    return {
      colors: {
        primary: "#000000",
        secondary: "#FFFFFF",
        button: "#000000",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#000000]",
      },
      logo: {
        path: "/Images/aecom.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("atmos")) {
    return {
      colors: {
        primary: "#407EC9",
        secondary: "#000000",
        button: "#407EC9",
        gradient: "bg-gradient-to-b from-[#407EC9] to-[#000000]",
      },
      logo: {
        path: "/Images/atmos.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("att")) {
    return {
      colors: {
        primary: "#00B5E2",
        secondary: "#000000",
        button: "#00B5E2",
        gradient: "bg-gradient-to-b from-[#00B5E2] to-[#000000]",
      },
      logo: {
        path: "/Images/att.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("boa")) {
    return {
      colors: {
        primary: "#00205B",
        secondary: "#EE2737",
        button: "#002D72",
        gradient: "bg-gradient-to-b from-[#002D72] to-[#EE2737]",
      },
      logo: {
        path: "/Images/boa.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("bsw")) {
    return {
      colors: {
        primary: "#7BA4DB",
        secondary: "#FFC72C",
        button: "#FFC72C",
        gradient: "bg-gradient-to-b from-[#7BA4DB] to-[#236192]",
      },
      logo: {
        path: "/Images/bsw.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("addus")) {
    return {
      colors: {
        primary: "#006BA6",
        secondary: "#A8A99E",
        button: "#A8A99E",
        gradient: "bg-gradient-to-b from-[#0283BE] to-[#006BA6]",
      },
      logo: {
        path: "/Images/addus.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("brinker")) {
    return {
      colors: {
        primary: "#000000",
        secondary: "#F1B434",
        button: "#E87722",
        gradient: "bg-gradient-to-b from-[#F1B434] to-[#000000]",
      },
      logo: {
        path: "/Images/brinker.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("capgemini")) {
    return {
      colors: {
        primary: "#006BA6",
        secondary: "#009ACE",
        button: "#006BA6",
        gradient: "bg-gradient-to-b from-[#009ACE] to-[#006BA6]",
      },
      logo: {
        path: "/Images/capgemini.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("capitalone")) {
    return {
      colors: {
        primary: "#D22630",
        secondary: "#003D4C",
        button: "#D22630",
        gradient: "bg-gradient-to-b from-[#003D4C] to-[#D22630]",
      },
      logo: {
        path: "/Images/capitalone.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("cbre")) {
    return {
      colors: {
        primary: "#034638",
        secondary: "#FFFFFF",
        button: "#034638",
        gradient: "bg-gradient-to-b from-[#034638] to-[#034638]",
      },
      logo: {
        path: "/Images/cbre.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("abb")) {
    return {
      colors: {
        primary: "#E4002B",
        secondary: "#FFFFFF",
        button: "#004C97",
        gradient: "bg-gradient-to-b from-[#004C97] to-[#5BC2E7]",
      },
      logo: {
        path: "/Images/abb.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("imprimis")) {
    return {
      colors: {
        primary: "#E4002B",
        secondary: "#FFFFFF",
        button: "#00629B",
        gradient: "bg-gradient-to-b from-[#5BC2E7] to-[#00629B]",
      },
      logo: {
        path: "/Images/imprimis.png",
      },
      height: "160",
      width: "160",
    };
  } else if (route.endsWith("lifecouriers")) {
    return {
      colors: {
        primary: "#E4002B",
        secondary: "#FFFFFF",
        button: "#00629B",
        gradient: "bg-gradient-to-b from-[#5BC2E7] to-[#00629B]",
      },
      logo: {
        path: "/Images/lifecouriers.png",
      },
      height: "160",
      width: "160",
    };
  } else return undefined;
};
