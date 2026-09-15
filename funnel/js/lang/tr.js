/* Türkçe — строки интерфейса воронки.
   Структура повторяет английский объект в js/copy.js ключ в ключ.
   Биллинг и юридические строки сюда не переводятся — см. ниже.

   Плейсхолдер {s} подставляется как название знака в именительном падеже,
   поэтому все фразы с ним построены через слово «burç»: аффикс садится на
   него, а не на имя знака, и вокальная гармония остаётся правильной при
   любом из двенадцати вариантов. */
(function (global) {
  'use strict';

  var EN = global.COPY_ALL && global.COPY_ALL.en;
  if (!EN) { return; }

  var C = {
    brand: 'AstroMap App',
    progress: 'Haritan',                 /* ≤ 14 знаков */
    ctaNext: 'Devam',
    ctaCalc: 'Haritamı hesapla',
    ctaSummary: 'Özeti gör',
    notNow: 'Şimdi değil',
    computing: 'Doğduğun an için konumları hesaplıyorum…',

    months: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
             'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],

    a11y: {
      progress: 'Haritanın kurulma ilerlemesi',
      themes: 'Seçilecek bölümler',
      reasons: 'Neden henüz almadın'
    },

    pv: {
      title: 'AstroMap içinde haritan',
      sub: 'Aynı harita, uygulamanın kullandığı kodla hesaplandı. Dokunup gez.',
      tabs: { today: 'Bugün', chart: 'Harita', retro: 'Retrolar' },
      points: {
        Sun: 'Güneş', Moon: 'Ay', Mercury: 'Merkür', Venus: 'Venüs', Mars: 'Mars',
        Jupiter: 'Jüpiter', Saturn: 'Satürn', Uranus: 'Uranüs', Neptune: 'Neptün', Pluto: 'Plüton',
        Node: 'Ay düğümü', ASC: 'Yükselen', MC: 'MC'
      },
      codes: {
        Sun: 'Gü', Moon: 'Ay', Mercury: 'Me', Venus: 'Ve', Mars: 'Ma',
        Jupiter: 'Jü', Saturn: 'Sa', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
        ASC: 'AC', MC: 'MC'
      },
      aspects: {
        conjunction: 'kavuşum', sextile: 'altmışlık',
        square: 'kare', trine: 'üçgen', opposition: 'karşıtlık'
      },
      tone: { soft: 'kolay', hard: 'zor', neutral: 'nötr' },
      fromSky: 'şu anki gök', toChart: 'senin haritan',
      moonNow: 'Ay şu anda',
      illum: 'Aydınlanma',
      moonShift: 'Burç değiştiriyor',
      today: 'bugün', tomorrow: 'yarın', inDays: '{n} gün sonra',
      orb: 'orb',
      activeNow: 'Şu anda dar açı sayısı: {n}',
      lockTransits: 'Kalan {n} tanesi, tam zirve tarihleriyle birlikte uygulamada.',
      planets: 'Haritandaki noktalar', aspectsN: 'Haritandaki açılar', housesN: 'Evler',
      noHouses: 'doğum saati yok',
      lockChart: 'Açı listesi, evler ve seçtiğin herhangi bir tarih uygulamada.',
      retroTitle: 'Şu anda retro sayısı: {n}',
      retroNow: 'geri gidiyor',
      inSign: '{s} burcunda',
      noRetro: 'Şu anda retro giden gezegen yok.',
      lockRetro: 'Dönüş tarihleri, gölge dönemleri ve haritanda dokundukları ev uygulamada.'
    },

    map: {
      sun: 'Güneş', moon: 'Ay', asc: 'Yükselen',
      sunShort: 'Gü', moonShort: 'Ay', ascShort: 'AC',
      waitDate: 'tarihini bekliyor',
      waitTime: 'saat ve yer bekliyor',
      noAsc: 'doğum saati gerekiyor',
      firstPoint: 'Haritandaki ilk nokta. Saat ve yeri ekleyince diğer ikisi de geliyor.'
    },

    s1: {
      eyebrow: 'Tek bir tarihle başla',
      title: 'Ne zaman doğdun?',
      day: 'Gün', month: 'Ay', year: 'Yıl',
      resultLabel: 'Güneşin',
      elementLabel: 'Element'
    },

    s2: {
      eyebrow: '2 ya da 3 seç',
      title: 'Haritana ne girsin?',
      hint: 'Bu bölümler okumanda karşına çıkacak.',
      themes: [
        { k: 'love',  t: 'Aşk ve ilişkiler',      d: 'Sana kim uyar, neden' },
        { k: 'money', t: 'İş ve para',            d: 'Doğal çekimin nereye' },
        { k: 'calm',  t: 'Dinlenme ve uyku',      d: 'Seni gerçekten ne toparlıyor' },
        { k: 'self',  t: 'Ben ve sınırlarım',     d: 'Nerede fazlasını veriyorsun' }
      ]
    },

    s3: {
      eyebrow: 'Asıl önemli adım',
      title: 'Doğum saati ve yeri',
      hint: 'Saat olmadan Yükselen çıkmaz — Yükselen de bıraktığın ilk izlenim demek.',
      hour: 'Saat', minute: 'Dakika', city: 'Şehir',
      cityPlaceholder: 'Şehir adını yazmaya başla…',
      cityNoMatch: 'Şehir bulunamadı',
      cityManual: 'Şehrimi bulamıyorum',
      cityManualName: 'Yerin adı',
      cityManualOffset: 'Saat dilimi (UTC)',
      cityManualApply: 'Bunu kullan',
      cityManualNote: 'Koordinat olmadan Güneş ile Ay hesaplanır, Yükselen hesaplanmaz — onun için kesin bir yer gerekir, tahmin etmiyorum.',
      unknown: 'Saati bilmiyorum',
      unknownNote: 'Güneş ile Ay\'ı hesaplarım. Doğum belgende saati bulana kadar Yükselen boş kalır.',
      moonLabel: 'Ay',
      ascLabel: 'Yükselen',
      ascEmptyShort: 'saat yok',
      ascEmptyPlace: 'kesin yer gerekiyor',
      stageTz: 'Doğum göğünü konumlandırıyorum',
      stageSun: 'Güneş\'i hesaplıyorum',
      stageMoon: 'Ay\'ı hesaplıyorum',
      stageAsc: 'Yükselenini buluyorum',
      stageDone: 'Haritanı kuruyorum',
      big3Lead: 'Her haritanın başladığı üç nokta. Ayrı ayrı değil, birlikte.',
      roleSun: 'özünde kim olduğun',
      roleMoon: 'nasıl hissettiğin ve neye ihtiyacın olduğu',
      roleAsc: 'haritanın dünyayla nasıl karşılaştığı',
      cuspNote: 'Işığın tam burç sınırında duruyor — bu kadar yakın bir konumda dakika bile fark eder.'
    },

    s4: {
      eyebrow: 'Son soru',
      title: 'Bir ilişkiye bakalım',
      hint: 'Aklındaki kişinin doğum tarihi. Saat verilmezse öğlen üzerinden hesaplarım, yani Ay\'ı yaklaşık olabilir.',
      skip: 'Bu adımı atla',
      scoreLabel: 'Uyum göstergesi',
      scoleFoot: 'Aranızdaki Güneş ve Ay açılarından kurulan, 38–96 ölçeğinde bir gösterge. Astrolojik yöntem, kehanet değil.',
      bands: [
        { min: 0,  t: 'Uzun vadede zor iş',      d: 'Çekim var, ama gündelik hayat ikinize de beklediğinizden pahalıya gelecek.' },
        { min: 55, t: 'Konuşursanız yürür',      d: 'Burada hiçbir şey kendiliğinden olmuyor. Açık konuşursanız gerçek bir şans var.' },
        { min: 70, t: 'Güçlü bir çift',          d: 'Aylarınız aynı ritmi tutuyor. Dışarıdan bakanın sakin dediği tür.' },
        { min: 84, t: 'Ender bir bağ',           d: 'Bu kadar kesin bir açı sık görülmez. Gerisi yalnızca onunla ne yaptığınız.' }
      ]
    },

    s5: {
      eyebrow: 'Harita kuruldu',
      title: 'Haritan hazır',
      coreTitle: 'Çekirdeğin',
      focusTitle: 'Odağın',
      skyTitle: 'Şu anda haritanın üzerindeki gök',
      pairTitle: 'İlişki',
      closeNow: 'Dar açılar',
      retroNow: 'Retro',
      skyNote: 'Bu tam şu an için hesaplandı, yarın başka olacak — doğum haritası kalır, üstündeki gök yürür.',
      cta: 'Haritana gir',
      ready: 'Aşağıda aynı harita uygulamanın içinde — dokunup gez.'
    },

    pw: {
      focusLine: 'Odağın — {areas} — haritayla birlikte geliyor: uygulamada ilk neyi göreceğini o belirliyor.',
      opensTitle: 'Neler açılıyor',
      opens: [
        { t: 'Doğum haritan. ', d: 'Çember, gezegenler, evler, açılar ve element dengesi — ikinci bir halkada istediğin günün göğüyle.' },
        { t: 'Gök ile haritan karşı karşıya. ', d: 'Şu anda ne aktif, ne zaman başladı, ne zaman sönüyor; zirve tarihleri dakikasına kadar.' },
        { t: 'Ay. ', d: 'Evre, aydınlanma, burç, sıradaki yeni ay ve dolunay, bir ay öncesinden.' },
        { t: 'Retrolar. ', d: 'Kim ne zaman dönüyor, gölge dönemleri ve haritanın hangi evine dokunduğu.' },
        { t: 'Uyum. ', d: 'Sinastri göstergesi, en güçlü temaslar ve iki kişinin birleşik haritası.' },
        { t: 'Zaman çizelgen. ', d: 'Ne geliyor — evreler, dönüşler ve kesin açılar; saklamaya değer olan her şey kayıtlı.' }
      ],
      movesTitle: 'Gök yürümeye devam ediyor',
      movesAspects: 'bugün haritana dar açı',
      movesMoon: 'Ay {s} burcuna geçene kadar',
      movesRetro: 'gezegen geri gidiyor',
      movesNote: 'Her bölüm, seçtiğin tarihe göre yeniden hesaplanıyor. Abonelik tam da bunun için: doğum haritan değişmiyor, üstündeki gök her gün değişiyor.'
    },

    paywall: {
      eyebrow: 'AstroMap App',
      title: 'Haritan hazır',
      planTitle: 'Aylık plan',
      cta: 'Haritamı aç',
      checkoutOff: 'Ödeme henüz bağlı değil. Bilgilerin kayıtlı — birazdan tekrar uğra.'
    },

    recovery: {
      title: 'Okuman zaten hesaplandı',
      sub: 'İlk paragraf burada. Gerisi hesabında bekliyor.',
      surveyTitle: 'Seni ne durdurdu?',
      survey: [
        { k: 'price', t: 'Çok pahalı' },
        { k: 'trust', t: 'İşe yaradığından emin değilim' },
        { k: 'what',  t: 'Ne aldığım belli değil' },
        { k: 'look',  t: 'Sadece bakıyorum' }
      ],
      answers: {
        trust: 'İşte verdiğin tarih, saat ve yerden hesaplanan konumların. Bu, efemeris tablolarının kullandığı matematiğin aynısı — herhangi bir astroloji hesaplayıcısında dene, aradaki fark derecenin onda birini geçmemeli.',
        what: 'Haritanın güncel gökle buluştuğu uygulamaya erişim alıyorsun. Somut olarak:',
        look: 'Olur. Haritan bu tarayıcıda kayıtlı kalıyor, aşağıdaki okuma da ücretsiz ve eksiksiz — içinde örtülmüş hiçbir şey yok.'
      },
      yearCta: 'Yıllık planı al',
      backToPlan: 'Aylık plana dön',
      readFree: 'Ücretsiz okumayı aç'
    },

    moonPhase: ['Yeni ay', 'Büyüyen hilal', 'İlk dördün', 'Büyüyen şişkin ay',
                'Dolunay', 'Küçülen şişkin ay', 'Son dördün', 'Küçülen hilal'],

    signs: ['Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak',
            'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık'],
    signsIn: ['Koç burcunda', 'Boğa burcunda', 'İkizler burcunda', 'Yengeç burcunda',
              'Aslan burcunda', 'Başak burcunda', 'Terazi burcunda', 'Akrep burcunda',
              'Yay burcunda', 'Oğlak burcunda', 'Kova burcunda', 'Balık burcunda'],
    elements: { fire: 'Ateş', earth: 'Toprak', air: 'Hava', water: 'Su' },

    sun: [
      'Önce hareket edip sonra soruyorsun. Gücün başlamakta, sürdürmekte değil.',
      'Temponun acele ettirilmesinden nefret ediyorsun. Yavaş, ama sonuna kadar.',
      'Konuştuğundan hızlı düşünüyorsun, o yüzden cümle nadiren başladığı yerde bitiyor.',
      'Bir odanın havasını herkesten önce okuyorsun. Sebepsiz yorgunluk oradan.',
      'Sana seyirci gerekiyor; kibirden değil, yaptığın şeyin bir ağırlığı olsun diye.',
      'Bütünü bozan ayrıntıyı görüyorsun. Bedeli: hiçbir şey bitmiş gibi durmuyor.',
      'Herkesin rahatını kendininkinden önce koyup buna huzur diyorsun.',
      'Hiçbir şeyi yarım yapmıyorsun. Ya tamamen ya hiç — gitmek de dahil.',
      'Zorluğa cevabın konuşmak değil hareket. Bazen bu kaçış oluyor.',
      'On yıl verilse her şeyi sıfırdan kurarsın.',
      'Mesafeyi soğukluktan değil içgüdüyle koruyorsun.',
      'Başkalarının duygusunu emiyor, onların senin olmaktan çıktığı anı kaçırıyorsun.'
    ],
    moon: [
      'Duyguların kısa ve sıcak. Patlıyor, arkasından ortalık açılıyor.',
      'Seni hep aynı şeyler sakinleştiriyor: yemek, bir battaniye, tanıdık bir oda.',
      'Bir duyguyu hazmetmek için konuşuyorsun. Sessizlik seni huzursuz ediyor.',
      'Her kırgınlığı, cümlesine kadar hatırlıyorsun.',
      'Senin için kötüleştiğini birinin fark etmesine ihtiyacın var.',
      'Ağlamak yerine topluyorsun. Korkunun içinden geçmenin yolu beden.',
      'Kimsenin yanında öfkelenemiyorsun. Yalnız kalmanı bekliyor.',
      'Sakinliğe güvenmiyorsun. İşin nerede tersine döneceğini arıyorsun.',
      'Üzüntüyü yolculuk planlayarak geçiştiriyorsun, hiç çıkmayacağın bir yolculuk olsa bile.',
      'Yardım istemek sana utanç veriyor. Üç katı işi yapmayı tercih ediyorsun.',
      'Bir duyguyu hissetmek yerine çözümlüyorsun. Bir yere kadar işe yarıyor.',
      'Senin ruh halinle başkasınınki arasında sınır yok.'
    ],
    asc: [
      'İnsanlar birazdan bir şeye karar verecek birini görüyor. Tereddüdün tam ortasında bile.',
      'Sakin ve pahalı bir izlenim bırakıyorsun. İlk gelen bu oluyor.',
      'Hafif ve müsait görünüyorsun — yabancıların içini dökmesi ondan.',
      'Bu işi üstlenecek birine benziyorsun. Önce sana soruyorlar.',
      'Girdiğinde odanın sıcaklığı kayıyor. Bu kapanmıyor.',
      'Yetkin görünüyorsun, böylece başkasının işi sende kalıyor.',
      'Kabul edeceğini varsayıyorlar. Genelde de haklılar.',
      'Söylediğinden fazlasını biliyor gibisin. Bu ürkütebiliyor.',
      'Birazdan gidecek birine benziyorsun. Kaldığın zaman bile.',
      'Olduğundan daha yaşlı ve daha ciddi okunuyorsun. Hep öyleydi.',
      'Ayrı duran birini görüyorlar. Sevimli, ama tam orada değil.',
      'Yüzünü davet gibi okuyorlar. Çoğu zaman yanlışlıkla.'
    ]
  };

  /* Цена, условия списания и согласие с документами остаются английскими
     намеренно: это не текст интерфейса, а обязательства перед человеком,
     и машинный перевод суммы, срока отмены или ссылки на условия — это то,
     что разбирают в спорах по автопродлению. Их пишет юрист под каждый
     рынок, вместе с валютой. */
  C.billing = EN.billing;
  C.paywall.legal = EN.paywall.legal;
  C.paywall.terms = EN.paywall.terms;
  C.paywall.privacy = EN.paywall.privacy;
  C.paywall.privacyInline = EN.paywall.privacyInline;
  C.recovery.yearTitle = EN.recovery.yearTitle;
  C.recovery.answers.price = EN.recovery.answers.price;

  global.COPY_ALL.tr = C;
  if (global.LANG === 'tr') { global.COPY = C; }
})(typeof window !== 'undefined' ? window : globalThis);
