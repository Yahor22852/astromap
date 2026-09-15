/* Türkçe — тексты разбора. Структура повторяет английский объект в
   js/reading-copy.js ключ в ключ. */
(function (global) {
  'use strict';

  if (!global.READING_ALL) { return; }

  var R = {
    ui: {
      title: 'Haritan',
      forWhom: '{date}, {city} için okuma',
      secPositions: 'Üç konumun',
      secThemes: 'Bölümlerin',
      secWeek: 'Bu hafta',
      secPair: 'Uyum',
      sun: 'Güneş', moon: 'Ay', asc: 'Yükselen',
      noAsc: 'Yükselen hesaplanmadı — doğum saati verilmemiş.',
      weekRange: '{from} — {to} haftası',
      weekMoon: 'Haftanın Ay\'ı',
      weekSun: 'Güneş\'in konumuna göre durumu',
      recalc: 'Bu bölüm her hafta güncel konumlardan yeniden hesaplanıyor.',
      pairScore: 'Uyum göstergesi',
      pairStrongest: 'Aranızdaki en güçlü açı',
      pairFoot: 'Aranızdaki Güneş ve Ay açılarından, 38–96 ölçeğinde bir gösterge. Astrolojik yöntem, kehanet değil.',
      noPair: 'İkinci bir kişi eklemedin. Uyumu hesaplamak için forma dön.',
      empty: 'Bu tarayıcıda kayıtlı harita bulunamadı. Formu yeniden doldur.',
      back: 'Forma dön',
      goTitle: 'Bu, tek bir günün fotoğrafı',
      goText: 'Yukarıda doğum haritan ve bu haftanın göğü var. Harita değişmeyecek; üstündeki gök her gün değişiyor. AstroMap\'te aynı konumlar seçtiğin herhangi bir tarihe göre yeniden hesaplanıyor: pencereleri ve zirve tarihleriyle transitler, Ay, retrolar, zaman çizelgen ve evleriyle birlikte tam çember.',
      goCta: 'AstroMap\'i aç',
      disclaimer: 'İçerik eğlence amaçlıdır ve uzman görüşünün yerine geçmez.'
    },

    sun: [
      'Güneşin çalışmaya başlayan bir motor gibi: karar, sen onu düşünüp bitirmeden düşüyor. İyi başlıyorsun, yalnızca dayanmanın kaldığı aşamada zorlanıyorsun. Güç ilk hamlede, onuncu haftada değil.',
      'Güneşin kimsenin temposunu kabul etmiyor. Karar vermek için zaman istiyorsun, sonra da o karara dönmüyorsun — başkalarının bir ayda bıraktığı yerde bu yüzden kazanıyorsun. Bedeli: çoktan bitmiş şeylerin içinde kalıyorsun.',
      'Güneşin konuştuğundan hızlı düşünüyor, o yüzden cümle nadiren başladığı yerde bitiyor. Yeni uyaran sana oksijen gibi; can sıkıntısı yorgunluktan daha ağır vuruyor.',
      'Güneşin bir odanın havasını kapıdan okuyor ve üstüne alıyor. Sebebi belirsiz yorgunluk oradan. Yakınlık senin için çalışmanın ödülü değil, koşulu.',
      'Güneşin seyirci istiyor, ama kibirden değil: yaptığın şeyin bir tanığı ve bir anlamı olsun istiyorsun. O olmayınca iyi iş bile boş çınlıyor.',
      'Güneşin bütünü bozan ayrıntıyı görüyor ve artık görmezden gelemiyor. Bu yüzden bir şeye nadiren bitti diyorsun, yeterince iyi olduğunu ise daha da nadiren.',
      'Güneşin odadaki herkesin rahatını kendininkinden önce sayıyor. Buna huzur diyorsun, ama çoğu zaman bu ertelenmiş kendi kararın.',
      'Güneşin hiçbir şeyi yarım yapmıyor. Ya tamamen giriyorsun ya hiç — gitmek de buna dahil. Bu sana başkalarında olmayan bir derinlik veriyor, bir de tek başına ödediğin bir bedel.',
      'Güneşin zorluğa hareketle cevap veriyor: bir yolculuk, bir plan, başka bir yön. Bu bazen cesaret, bazen kaçış oluyor; farkı ancak sonradan görülüyor.',
      'Güneşin yavaş ve kendi şartlarıyla kuruyor. Başkalarının ömür boyu ertelediğini on yılda yapıyorsun, ama dinlenmeyi hak edilmesi gereken bir şey sayıyorsun.',
      'Güneşin mesafeyi soğukluktan değil içgüdüyle koruyor. Kimsenin seni düzenlemediği bir alana ihtiyacın var, ve ancak oradan yaklaşıyorsun.',
      'Güneşin çevredeki duyguyu o kadar keskin emiyor ki, onların senin olmaktan çıktığı anı kaçırmak kolay. İnsanlardan sonra sessizlik ihtiyacı oradan.'
    ],

    moon: [
      'Ay\'ın anında tepki veriyor: patlıyor, arkasından ortalık açılıyor. Öfkeyi uzun tutmuyorsun ve bu seni koruyor. Sorun, karşındakinin konuşma değil sessizlik istediği yerde başlıyor.',
      'Ay\'ın beden üzerinden sakinleşiyor: yemek, bir battaniye, bilinen bir yer, aynı ritüel. Haber verilmeden gelen değişiklik sana kabul etmek istediğinden pahalıya geliyor.',
      'Ay\'ın hissettiğini konuşarak hazmediyor. Anlatmadan ne hissettiğini tam bilmiyorsun. İlişkideki sessizlik sana alarm gibi geliyor.',
      'Ay\'ın bir kırgınlığı cümlesine ve tonuna kadar hatırlıyor. Affediyorsun ama silmiyorsun — eski konuşmaların yeni tartışmaların içinde geri gelmesi bu yüzden.',
      'Ay\'ın senin için kötüleştiğini birinin fark etmesine ihtiyaç duyuyor. Bunu açıkça nadiren istiyorsun; daha çok gösterip sorulmasını bekliyorsun.',
      'Ay\'ın ağlamak yerine topluyor. Temizlik, listeler, bir plan. Kısa vadede işe yarıyor ve duyguyu sonraya kaldırıyor, genelde de mümkün olan en kötü ana.',
      'Ay\'ın insanların önünde öfkelenemiyor. Öfkeyi yalnız kaldığın ana saklıyorsun, orada da konuşmaya değil geviş getirmeye dönüşüyor.',
      'Ay\'ın sakinliğe güvenmiyor. İyi bir haftada bile işin tersine döneceği yeri arıyorsun, çünkü bir şeyin gerçekten kırıldığı anı böyle taşımak daha kolay.',
      'Ay\'ın üzüntüyü planlayarak tedavi ediyor: bir yolculuk, bir kurs, bir yön. Hiç gitmesen bile plan baskıyı şimdiden düşürüyor.',
      'Ay\'ın yardım istemekten utanıyor. Yetişemediğini söylemektense üç katı işi yapmayı seçiyorsun — sonra da herkese aynı anda kızıyorsun.',
      'Ay\'ın bir duyguyu hissetmek yerine çözümlüyor. Duygu yine de geldiği ana kadar işe yarıyor; o da daha geç ve daha güçlü geliyor.',
      'Ay\'ın senin ruh halinle başkasınınki arasında sınır tanımıyor. İnsanların arasında geçen bir günün ardından sana bir buluşma daha değil sessizlik gerekmesi bu yüzden.'
    ],

    asc: [
      'İnsanlar birazdan bir şeye karar verecek birini görüyor, tereddüdün tam ortasında bile. Sorumluluk sana istemenden önce ulaşıyor.',
      'Sakin ve pahalı bir izlenim bırakıyorsun. Bu kapı açıyor, bir yandan da kimsenin yardıma ihtiyacın var mı diye sormamasına yol açıyor.',
      'Hafif ve müsait görünüyorsun, bu yüzden bir yabancı on dakikada içini döküyor. Bazen o konuşmalardan karşındakinden daha yorgun çıkıyorsun.',
      'Bu işi üstlenecek birine benziyorsun, o yüzden önce sana soruyorlar. Hayır demek sana işin kendisinden pahalıya geliyor.',
      'Girdiğinde odanın sıcaklığı kayıyor. Bu kapanmıyor, görünmez olmak istediğin günde bile.',
      'Yetkin görünüyorsun, böylece başkasının işi sende kalıyor. Genelde de teslim ediyorsun, çemberin düzgünce kapanması ondan.',
      'Kabul edeceğini varsayıyorlar ve genelde haklılar. Nezaketin fikri olmamak diye okunuyor, oysa öyle değil.',
      'Söylediğinden fazlasını biliyor gibisin. Bazıları bundan ürküyor; geri kalanı sana güvenmek için sebep sayıyor.',
      'Birazdan gidecek birine benziyorsun, kaldığın zaman bile. Bu yüzden sana nasıl olduğundan çok planlarını soruyorlar.',
      'Olduğundan daha yaşlı ve daha ciddi okunuyorsun. İşte işe yarıyor, hafifliği zorlaştırıyor.',
      'Ayrı duran birini görüyorlar: sevimli, ama tam orada değil. Yaklaşmak karşı taraftan girişim istiyor.',
      'Yüzünü davet gibi okuyorlar, öyle olmadığı zaman da. Başlangıçtaki yanlış anlaşılmalar oradan.'
    ],

    themes: {
      love: {
        t: 'Aşk ve ilişkiler',
        fire: 'Aşkta sana tempo ve dobra dürüstlük gerekiyor. Temkin seni sıkıyor, oysa iki tarafın da hızlı gittiği ilişkileri kurtaran tam olarak temkin.',
        earth: 'Aşkta beyanları değil tekrarı sayıyorsun. Güven sende aylar alıyor, bir hayal kırıklığından sonra yeniden kurulması da tam o kadar.',
        air: 'Aşkta sana jestlerden çok konuşma gerekiyor. Sessizlik sana alarm gibi geliyor, oysa karşındaki için çoğu zaman yalnızca sakinlik demek.',
        water: 'Aşkta karşındakini o kendini anlamadan önce hissediyorsun. Bakmanın birlikte olmanın yerini almaya başladığı noktaya dikkat et.'
      },
      money: {
        t: 'İş ve para',
        fire: 'İşte en iyi olduğun yer başlangıç: yeni bir proje, bir kriz, bir teslim tarihi. Rutin seni aşırı yükten daha hızlı tüketiyor.',
        earth: 'İşte avantajın dayanıklılık. Yıllar üzerinden kazanıyorsun, ama fiyatını başkası söylemeden söylemeyi öğrenmen gerekiyor.',
        air: 'İşte bağlantılarla ve hızlı öğrenmeyle kazanıyorsun. Asıl risk: açılmış on yön, kapanmış hiçbiri.',
        water: 'İşte seni tablo değil anlam yönetiyor. İnsanları iyi okuyorsun, o yüzden pazarlıklar sandığından iyi gidiyor — ilk sen geri adım atmadığın sürece.'
      },
      calm: {
        t: 'Dinlenme ve uyku',
        fire: 'Seni uzanmak değil hareket toparlıyor. Antrenman, yol ve bedensel yorgunluk uykun için boş bir akşamdan fazlasını yapıyor.',
        earth: 'Seni ritim ve bilinen çevre toparlıyor. Uykun işin miktarından değil plandaki karmaşadan bozuluyor.',
        air: 'Seni beden değil kafanın susması toparlıyor. Uyaranı kesmeden yorgun yatıp düşünmeye devam ediyorsun.',
        water: 'Seni insanlardan sonraki yalnızlık ve su toparlıyor: bir banyo, bir havuz, nehir kenarında bir yürüyüş. O olmadan başkalarının duygusunu bütün hafta taşıyorsun.'
      },
      self: {
        t: 'Ben ve sınırlarım',
        fire: 'Sınırın, hızı onay sandığın yerde kırılıyor. Evet demeden önce kendine bir gün ver.',
        earth: 'Sınırın, sıfırdan başlamamak için fazla kaldığın yerde kırılıyor. Kalmak, değiştirmekten pahalıya gelebiliyor.',
        air: 'Sınırın, kendini meselenin sürdüğünden uzun anlattığın yerde kırılıyor. Daha kısa bir cümle genelde yetiyor.',
        water: 'Sınırın, başkasının duygusunu kendi görevin saydığın yerde kırılıyor. Şefkat seni onu onarmakla yükümlü kılmıyor.'
      }
    },

    transitMoon: [
      'Koç\'taki Ay tepkileri hızlandırıyor. Başlamak için iyi bir hafta, sıcağı sıcağına mesaj atmak için kötü.',
      'Boğa\'daki Ay tempoyu düşürüyor. Beden düzen istiyor: uyku, yemek ve sakin bir akşam her planı yeniyor.',
      'İkizler\'deki Ay seni uyaranla dolduruyor. Konuşmak kolay geliyor, odaklanmak gelmiyor — işleri kısa tut.',
      'Yengeç\'teki Ay hassasiyeti yükseltiyor. Yakın konulardaki konuşmalar her zamankinden kolay geçiyor.',
      'Aslan\'daki Ay seyirci istiyor. Bitmiş işi göstermek için iyi an, ilgi için kavga etmek için kötü.',
      'Başak\'taki Ay topluyor. Yarım kalanları kapatmak için iyi bir hafta, kendini yargılamak için kötü.',
      'Terazi\'deki Ay denge arıyor. Barışmak kolaylaşıyor, net karar zorlaşıyor.',
      'Akrep\'teki Ay her şeyi derinleştiriyor. Gerçek konuşmalar evet, dürtüsel mesajlar hayır.',
      'Yay\'daki Ay ufku açıyor. Bir yolculuk ya da kurs planlamak, evde dinlenmekten daha çok iyi geliyor.',
      'Oğlak\'taki Ay duyguları soğutuyor. Resmî işler için iyi an, duygu konuşmaları için zayıf.',
      'Kova\'daki Ay mesafe veriyor. Durumunu dışarıdan göreceksin — karar vermek için kullan.',
      'Balık\'taki Ay kenarları siliyor. Dinlenmek ve uyku verimlilikten daha önemli.'
    ],

    transitAspect: {
      conjunction: 'Güneş doğum konumuna geri dönüyor. Bu, özet çıkarma değil başlama haftası.',
      semisquare: 'İstediğinle haftanın talep ettiği arasında küçük bir sürtünme. Büyük değil, ama yıpratıyor.',
      sextile: 'Elverişli açı: ilk adımı sen atarsan işler kolay gidiyor. Kendiliğinden olmuyorlar.',
      square: 'Planlarınla koşullar arasında gerilim. Rotayı düzeltme haftası, zorlama haftası değil.',
      trine: 'Döngünün en rahat düzeni. Aylardır ertelediğin şeye harca.',
      quincunx: 'Bir şey oturmuyor ve adını koymak zor. Küçük şeyleri toparlamak için iyi an.',
      opposition: 'Tam karşıtlık: durumunu öbür taraftan görüyorsun. Yüzleşme kavgaya dönmeden işe yarayabilir.'
    },

    pairAspect: {
      conjunction: 'Işıklarınız aynı yerde — anlatmadan anlaşıyor, aynı hataları da tekrarlıyorsunuz.',
      semisquare: 'Küçük ve tekrar eden bir sürtünme. İlişkiyi kırmıyor, ama aynı durumlarda geri geliyor.',
      sextile: 'Girişim isteyen bir kolaylık. Bu ikili, biri önce teklif ettiği sürece yürüyor.',
      square: 'En zor ve en çok geliştiren düzen. Çekiyor ve öğretiyor, bir de bedeli var.',
      trine: 'Ritimlerin doğal uyumu. Tek risk: bu kadar kolaylıkta kimse ilişkiye emek vermiyor.',
      quincunx: 'Sürekli ayar gerektiriyor. Aralarındakini konuşmayı seven çiftlerde yürüyor.',
      opposition: 'Aynı eksenin iki ucu. Güçlü bir çekim ve kalıcı bir pazarlık.'
    }
  };

  global.READING_ALL.tr = R;
  if (global.LANG === 'tr') { global.READING = R; }
})(typeof window !== 'undefined' ? window : globalThis);
