/* Türkçe — quiz v2 metinleri. js/quiz-copy.js içindeki İngilizce nesneyle
   anahtar anahtar aynı yapı. Hitap: sen. */
(function (global) {
  'use strict';
  if (!global.QUIZ_ALL) { return; }

  var Q = {
    phases: ['Odağın', 'Doğum bilgileri', 'Önizleme'],
    back: 'Geri',
    cont: 'Devam',
    paidNote: 'AstroMap abonelikli bir uygulamadır. Bu sorular ücretsiz: cevaplarından haritanın bir önizlemesi oluşur.',

    goal: {
      title: 'Şu an neyi daha iyi anlamak istersin?',
      sub: 'Haritanı oluşturup nereden başlayacağını gösterelim.',
      note: 'Bunu sonra değiştirebilirsin.',
      opts: {
        love:  ['İlişkiler', 'İhtiyaçlar, bağ, farklılıklar'],
        money: ['İş ve para', 'Güçlü yönler ve şimdiki dönem'],
        calm:  ['Toparlanma', 'Dinlenme, ritim, Ay döngüleri'],
        self:  ['Kendimi ve sınırlarımı', 'Tepkiler ve ihtiyaçlar']
      }
    },

    ctx: {
      title: {
        love: 'İlişkilerde tam olarak ne?',
        money: 'İş ve parada tam olarak ne?',
        calm: 'Toparlanmada tam olarak ne?',
        self: 'Kendinle ilgili tam olarak ne?'
      },
      sub: 'Önizlemenin önce ne göstereceği buna bağlı.',
      opts: {
        love:  { needs: 'Kendi ihtiyaçlarımı anlamak', connection: 'Belirli bir bağa bakmak', differences: 'Farklılıkları daha iyi anlamak' },
        money: { strengths: 'Güçlü yönlerimi anlamak', period: 'Şimdiki dönemi keşfetmek', overview: 'Harita özetiyle başlamak' },
        calm:  { cycles: 'Ay döngülerini tanımak', skynow: 'Bugünkü gökyüzüyle başlamak', needs: 'İhtiyaçlarımı daha iyi anlamak' },
        self:  { reaction: 'Nasıl tepki verdiğimi anlamak', needs: 'İhtiyaçlarımı keşfetmek', overview: 'Harita özetiyle başlamak' }
      },
      unsure: 'Henüz bilmiyorum'
    },

    dob: {
      title: 'Doğum tarihin',
      sub: 'Haritanı hesaplamaya tarihle başlıyoruz.',
      day: 'Gün', month: 'Ay', year: 'Yıl',
      decades: 'Bir on yıla git',
      pick: 'Her çarkı doğum tarihine çevir.',
      confirm: 'Tarihi onayla',
      clamped: 'Gün {d} olarak değiştirildi: bu ayın gün sayısı {n}.',
      future: 'Bu tarih henüz gelmedi.'
    },

    sun: {
      eyebrow: 'Haritanın ilk noktası',
      part: 'Birçok noktadan biri. Bir insanın tam tarifi değildir.',
      cta: 'Harita ayrıntılarını ekle'
    },

    tk: {
      title: 'Doğum saatini biliyor musun?',
      sub: 'Saat, yükselen burcu ve evleri hesaplamayı sağlar. Saat olmadan da devam edebilirsin.',
      yes: 'Tam saati biliyorum',
      yesD: 'Örneğin doğum belgesinden',
      no: 'Bilmiyorum',
      noD: 'Tarih ve yerin izin verdiğini hesaplarız'
    },

    time: {
      title: 'Doğum saatin',
      sub: 'Doğum yerindeki yerel saat.',
      hour: 'Saat', minute: 'Dakika', ampm: 'ÖÖ / ÖS',
      pick: 'Çarkları doğum saatine çevir.',
      confirm: 'Saati onayla',
      unknown: 'Saati bilmiyorum'
    },

    place: {
      title: 'Doğum yerin',
      sub: 'Yer, doğum tarihindeki saat dilimini ve saatle birlikte yükselen burcu belirler.',
      label: 'Doğduğun şehir veya yerleşim yeri',
      placeholder: 'Bir şehir yazmaya başla…',
      noMatch: 'Bir şey bulunamadı. Başka bir yazımı, yerel adı ya da en yakın büyük şehri dene.',
      selected: 'Doğum yeri',
      change: 'Değiştir',
      confirm: 'Yeri onayla',
      notFound: 'Yerim listede yok',
      nfTitle: 'En yakın büyük şehri seç',
      nfText: 'Aynı saat diliminde. Tarihin için onun saat dilimini kullanırız ama yükselen burcu ve evleri göstermeyiz: bunlar tam yeri gerektirir.',
      nfName: 'Yerin (isteğe bağlı, sadece görünüm için)',
      nfBack: 'Aramaya dön',
      approx: 'yaklaşık: {c} saat dilimi'
    },

    core: {
      title: 'Haritanın temeli',
      sub: 'Güneş, Ay ve yükselen: her haritanın başladığı üç nokta.',
      lead: 'Cevabın yüzünden önce gösteriliyor. Bu bir başlangıç noktası, haritandan çıkarılmış bir sonuç değil.',
      moonRange: 'Saat olmadan, o gün Ay iki burçtan birindeydi: {a} veya {b}. Gün içinde burç değiştirdi.',
      sunRange: 'Saat olmadan, o gün Güneş iki burçtan birindeydi: {a} veya {b}.',
      noAscTime: 'Doğum saati gerekli',
      noAscPlace: 'Tam yer gerekli'
    },

    extra: {
      title: 'Özetine başka ne eklensin?',
      sub: 'İsteğe bağlı. Uygulamadaki bölümlerin sırası buna bağlı.',
      only: 'Şimdilik sadece: {goal}'
    },

    start: {
      title: 'Nereden başlamak istersin?',
      sub: 'Abonelikten sonra uygulama burada açılır. Doğum haritan değişmez; bugünkü gökyüzüne ve seçtiğin tarihlere dönebilirsin.',
      opts: {
        chart: ['Doğum haritasından', 'Gezegenler, evler, açılar'],
        sky:   ['Bugünkü gökyüzünden', 'Şu an haritan için ne etkin'],
        dates: ['Yaklaşan tarihlerden', 'Ay evreleri, dönüşler, tam açılar']
      }
    },

    pask: {
      title: 'Düşündüğün kişinin doğum tarihini eklemek ister misin?',
      sub: 'Sadece tarih. İsim, iletişim bilgisi ya da ilişki ayrıntısı yok.',
      add: 'Tarihini ekle',
      skip: 'Onsuz devam et'
    },

    pdate: {
      title: 'Kişinin doğum tarihi',
      sub: 'Doğum saati olmadan bu kişinin Ay’ı yaklaşıktır.',
      confirm: 'Tarihi onayla'
    },

    load: {
      busy: 'Önizlemen hazırlanıyor…',
      fail: 'Önizleme yüklenmedi. Cevapların kaydedildi.',
      retry: 'Tekrar dene',
      skip: 'Önizleme olmadan devam et'
    },

    prev: {
      title: {
        love: 'İlişkilere odaklanan haritan',
        money: 'İş ve paraya odaklanan haritan',
        calm: 'Toparlanmaya odaklanan haritan',
        self: 'Sana ve sınırlarına odaklanan haritan'
      },
      frag: '{theme} · Güneş’in elementi: {element}',
      fragSrc: 'Güneş’inin elementine göre yorum, AstroMap metin kütüphanesinden.',
      plainTitle: 'Bugün, sade sözlerle',
      plainNone: 'Bugün haritana tam açı yok. En hızlı sinyal Ay: iki üç günde bir burç değiştirir.',
      details: 'Ayrıntılar',
      tabsLead: 'Uygulamadakiyle aynı hesap. Sekmelere dokun.',
      noon: 'Doğum saati bilinmiyor: noktalar 12:00 için gösteriliyor, bu yüzden Ay yaklaşıktır.',
      asp: {
        conjunction: 'Gökteki nokta haritandaki bir noktanın üzerinde: onun konusu öne çıkıyor.',
        sextile: 'Kullandığında işe yarayan kolay bir bağ.',
        square: 'İki nokta arasında gerilim: karar isteyen bir sürtünme.',
        trine: 'İki nokta arasında akıcı, doğal bir bağ.',
        opposition: 'İki nokta zıt yönlere çekiyor: görev denge.'
      },
      pairTitle: 'Senin Güneş’in ve onun Güneş’i',
      pair: {
        same: 'Aynı element ({e}): benzer tempo ve tepki biçimi.',
        fit: 'Genelde birbirini destekleyen elementler: {a} ve {b}.',
        diff: 'Farklı elementler: {a} ve {b}. Tempo farklı, bu yüzden şeyleri yüksek sesle söylemek işe yarar.'
      },
      pairNote: 'Yöntem endeksi: 38–96 ölçeğinde {n}. Astrolojik bir yöntem, ilişki hakkında bir tahmin değil.'
    },

    bridge: {
      title: 'Doğum haritan kalır. Gökyüzü hareket eder.',
      sub: 'AstroMap bu yüzden bir abonelik: haritan için yapılan hesap her gün değişir.',
      today: 'Bugün',
      next: 'Yaklaşanlar',
      moon: 'Ay: {phase} · {s}',
      moonNext: 'Ay burç değiştiriyor: {s}',
      tight: 'Haritana tam açılar: {n}',
      retro: 'Şu an geri harekette: {list}',
      first: 'Uygulamada önerilen ilk adım',
      act: {
        chart: 'Doğum haritanı aç',
        today: 'Haritan için bugünkü gökyüzüne bak',
        match: 'Uyumu aç',
        moon: 'Ay takvimini aç'
      },
      appTitle: 'Uygulamada şunları yapabilirsin',
      app: [
        'Haritan için şu an hangi transitlerin etkin olduğunu görmek',
        'Her şeyi seçtiğin herhangi bir tarihe göre yeniden hesaplamak',
        'Ay evrelerini bir ay öncesinden izlemek',
        'Tarihleri zaman çizelgene kaydetmek'
      ]
    },

    pay: {
      features: 'Odağın için',
      cta: 'Tam haritanı al',
      key: 'Ödemeden sonra Gumroad e-postayla bir lisans anahtarı gönderir. Bir kez girer ve bir şifre belirlersin.',
      seeYear: 'Yıllık planı gör',
      backPrev: 'Önizlemeye dön'
    },

    year: {
      title: 'Yıllık plan',
      sub: 'Aynı uygulama, yılda bir kez ödeme.',
      renew: 'yıllık, otomatik olarak yenilenir',
      equiv: 'Ayda yaklaşık $2.50; yılda bir kez $29.99 artı KDV olarak tahsil edilir.',
      cta: 'Tam haritanı al',
      back: 'Aylık plana dön',
      backPrev: 'Önizlemeye dön'
    }
  };

  global.QUIZ_ALL.tr = Q;
  if (global.LANG === 'tr') { global.QUIZ = Q; }
})(typeof window !== 'undefined' ? window : globalThis);
