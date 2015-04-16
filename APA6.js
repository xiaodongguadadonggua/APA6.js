// APA6 Format
// Authors + Year + Title + Journal + DOI
//
var log = function(msg){console.log(msg)};
var stglog = function(msg){console.log("====================\n"+msg+"\n====================\n")};
var isZero = function(v){
  if (v !== undefined && v.length != 0) {
    return false;
  }
  return true;
}

var _Config = {
  html: true,
  lang: "cn",
}

COMMOA = _Config.lang == "cn" ? "，" : ", ";
ETAL = _Config.lang == "cn" ? "等" : " et al. ";
LEFT_BRK = _Config.lang == "cn" ? "（" : " (";
RIGHT_BRK = _Config.lang == "cn" ? "）" : ")";
AND = _Config.lang == "cn" ? "和" : "and ";

var APA6 = function(raw){
  this.raw = raw;

  this.authors = [];
  this.year = null;
  this.title = "";
  this.journal = null;

  this.error = false;

  this.parse = function(){
    stglog(this.raw);
    reYear = /\(?\d{4}\w?\)?/i;
    if(!reYear.test(this.raw)){
      log("Year Not found!");
      return 1;
    }
    var year = this.raw.match(reYear)[0];//reYear.exec(this.raw);
    this.year = new Year(year.match(/\d{4}/)[0]);//, year.match(/[a-z]/)[0]);
    if (/[a-z]/.test(year)) {
      this.year.order = year.match(/[a-z]/)[0];
    }

    var splt = this.raw.split(year);

    var auWords = splt[0].match(/\w+\ \w+|-?\w+/g);
    var author = "";
    for (var i in auWords) {
      if (auWords[i].length > 1 && auWords[i][0] != "-") {
        if (i > 0) {
          var auObj = new Author();
          this.authors.push(auObj.parse(author));
        }
        author = auWords[i] + "+";
      }else{
        author += auWords[i] + "+";
      }
    }
    var auObj = new Author();
    this.authors.push(auObj.parse(author));

    var titleAndJournal = splt[1].split(".");
    if (titleAndJournal[0].length < 5) {
      titleAndJournal = titleAndJournal.splice(1);
    }
    console.log(titleAndJournal)

    this.title = titleAndJournal[0].trim();

    this.journal = new Journal();
    this.journal.parse(titleAndJournal.slice(1).join("."));// parse journal
  }
  this.fmt = function () {
    // Reference style
    var fmtstr = "";

    // Author
    for (var i in this.authors) {
      if (i == this.authors.length - 1 && i > 0) {
        fmtstr += " & " + this.authors[i].fmt().slice(0, -1);
      }else{
        fmtstr += this.authors[i].fmt();
      }
    }

    // Year
    fmtstr += " " + this.year.fmt() + ". ";

    // Title
    fmtstr += this.title + ". ";

    // Journal
    fmtstr += this.journal.fmt();

    console.info(fmtstr);
    return fmtstr;
  }
  this._citeInBracket = function(isFirst){
      switch(this.authors.length){
        case 1:
          return "("+this.authors[0].familyname+ ", "+ this.year.fmt(1) +")";
        case 2:
          return "("+this.authors[0].familyname + " & "+ this.authors[1].familyname+", "+this.year.fmt(1)+")";
        case 3:case 4:case 5:
               if (isFirst) {
                  var str = "(";
                  for (var i in this.authors) {
                    if(i < this.authors.length-1){
                      str += this.authors[i].familyname + ", "
                    }else{
                      str += "& " + this.authors[i].familyname + ", "
                    }
                  }
                  return str += this.year.fmt(1) + ")"
               }else{
                 return "("+this.authors[0].familyname+" et al., "+this.year.fmt(1)+")";
               }
        default:
          return "("+this.authors[0].familyname +" et al., "+this.year.fmt(1)+")";
      }
  }
  this._citeInContext = function(isFirst){
    switch(this.authors.length){
      case 1:
         return ""+this.authors[0].familyname+LEFT_BRK+this.year.fmt(1)+RIGHT_BRK;
      case 2:
          return ""+this.authors[0].familyname+AND+this.authors[1].familyname+LEFT_BRK+this.year.fmt(1)+RIGHT_BRK;
      case 3:case 4:case 5:
        if (isFirst) {
          var str = "";
          for (var i in this.authors) {
            if(i < this.authors.length - 1){
              if (_Config.lang == "cn") {
                str += "" + this.authors[i].familyname + "、";
              }else{
                str += "" + this.authors[i].familyname + ", ";
              }
            }else{
              if (_Config.lang == "cn") {
                str = str.slice(0, -1);
              }
              str += AND+ this.authors[i].familyname + LEFT_BRK+this.year.fmt(1)+RIGHT_BRK;
            }
          }
          return str;
        }else{
          return ""+this.authors[0].familyname+ ETAL +"("+this.year.fmt(1)+")";
        }
      default:
          return ""+this.authors[0].familyname+ETAL+LEFT_BRK+this.year.fmt(1)+RIGHT_BRK;
    }
  }
  this.cite = function(isBracket, isFirst){
    if (isBracket == "bracket") {
      return this._citeInBracket(isFirst);
    }else{
      return this._citeInContext(isFirst);
    }
  }
  // init parsing
  this.parse();
}
var Author = function(firstname, middlename, familyname){
  this.firstname = firstname;
  this.middlename = middlename;
  this.familyname = familyname;

  this.parse = function(raw){
    var ns = raw.split("+");
    this.familyname = ns[0];
    this.firstname = ns[1];
    if (ns.length > 3) {
      this.middlename = ns[3];
    }
    return this;
  };
  this.fmt = function(){
    if (isZero(this.firstname) || this.firstname.length !== 1) {
      console.error("Error: Author firstname wrong!");
      if (_Config.html) {
        this.firstname = "<span style='color:red;'>???</span>"
      }else{
        this.firstname = "???"
      }
    }
    var middle = isZero(this.middlename) ? "" : ". "+this.middlename;
    return ""+this.familyname+", "+this.firstname+middle+".,";
  }
}
var Year = function(year, order){
  this.year = year;
  this.order = order === undefined ? "" : order ;

  this.fmt = function(ref){
    if (ref === undefined) {
      return "("+ this.year + this.order +")";
    }else{
      return ""+this.year+this.order;
    }
  }
}
var Journal = function(title, vol, no, pagex, pagey){
  this.title = title;
  this.vol = vol;
  this.no = no;
  this.pagex = pagex;
  this.pagey = pagey;
  this.parse = function(raw){
    /*
    var splt = raw.split(",");

    this.title = splt[0].trim();

    var bracketIndex = splt[1].indexOf("(");
    if (bracketIndex  == -1) {
      this.vol = splt[1].trim();
    }else{
      this.vol = splt[1].slice(0, bracketIndex).trim();
      this.no = splt[1].slice(bracketIndex).match(/\d+/)[0];
    }
    if (splt.length > 2) {
      var pages = splt[2];
      this.pagex = pages.match(/\d+/g)[0];
      this.pagey = pages.match(/\d+/g)[1]
    }
    */
    var titleWords = raw.match(/[a-zA-Z]+/g);
    this.title = titleWords.join(" ");

    var vols = raw.match(/\d+\(?\d+?\)?/g)[0];
    this.vol = vols.split("(")[0];
    if(vols.indexOf("(") !== -1){
      this.no = vols.slice(vols.indexOf("(")+1, -1);
    }

    if(raw.indexOf(".") < raw.length - 2){
      return false;
    }
    return true;
  };
  this.fmt = function(){
    var fmtstr = "";
    if (_Config.html) {
      fmtstr = "<i>" + this.title + "</i>, " + this.vol;
    }else{
      fmtstr = "" + this.title + ", " + this.vol;
    }

    if (!isZero(this.no)) {
      fmtstr += "("+this.no+")"
    }
    fmtstr += ", ";
    if (isZero(this.pagex)) {
      console.error("Error: Journal start page not found!");
      this.pagex = _Config.html ? "<span style='color:red'>???</span>" : "???";
    }
    fmtstr += this.pagex;
    if (!isZero(this.pagey)) {
      fmtstr += "-" + this.pagey
    }

    fmtstr += ".";

    return fmtstr;
  }
}
/*
var example = "Wu,, Wick, F. A., & Pomplun, M. 2014a) Guidance of visual attention by semantic information in real-world scenes. Frontiers in psychology, 5.";
var examples = `Thorpe, S., Fize, D., & Marlot, C. (1996). Speed of processing in the human visual system. Nature, 381(6582), 520–522.
Torralbo, A., Walther, D. B., Chai, B., Caddigan, E., Li, F. -F. & Beck, D. M. (2013). Good exemplars of natural scene categories elicit clearer patterns than bad exemplars but not greater BOLD activity. PloS one, 8(3), e58594.
Torralba, A., Oliva, A., Castelhano, M. S., & Henderson, J. M. (2006). Contextual guidance of eye movements and attention in real-world scenes: the role of global features in object search. Psychological review, 113(4), 766.
Underwood, G., Foulsham, T., van Loon, E., Humphreys, L., & Bloyce, J. (2006). Eye movements during scene inspection: A test of the saliency map hypothesis. European Journal of Cognitive Psychology, 18(03), 321-342.
Walther, D. B., & Shen, D. (2014). Nonaccidental properties underlie human categorization of complex natural scenes. Psychological Science, 25(4), 851-860.
Westheimer, G. (2008). Was Helmholtz a Bayesian? a review. Perception, 37, 642-650.
Wu, C. C., Wick, F. A., & Pomplun, M. (2014). Guidance of visual attention by semantic information in real-world scenes. Frontiers in psychology, 5.
Wyatte, D., Curran, T., & O'Reilly, R. (2012). The limits of feedforward vision: Recurrent processing promotes robust object recognition when objects are degraded. Journal of cognitive neuroscience, 24(11), 2248-2261.
Wyatte, D., Jilk, D. J., & O'Reilly, R. C. (2014). Early recurrent feedback facilitates visual object recognition under challenging conditions. Frontiers in Psychology, 5, 674.
Xiao, J., Hays, J., Russell, B. C., Patterson, G., Ehinger, K. A., Torralba, A., & Oliva, A. (2013). Basic level scene understanding: categories, attributes and structures. Frontiers in psychology, 4.
Zhang, J., Marszałek, M., Lazebnik, S., & Schmid, C. (2007). Local features and kernels for classification of texture and object categories: A comprehensive study. International journal of computer vision, 73(2), 213-238.`;

examples.split("\n").forEach(function(exp){
  var apa = new APA6(exp);
  apa.fmt();
  console.info(apa.cite("bracket", 1));
  console.info(apa.cite("context", 1));
});
*/
var exp = "Dehaene, S., Changeux, J. P., Naccache, L., Sackur, J., and Sergent, C. (2006). Conscious preconscious and subliminal processing: a testable taxonomy. Trends Cogn Sci. 10(123123).";
var apa = new APA6(exp);
apa.fmt();
