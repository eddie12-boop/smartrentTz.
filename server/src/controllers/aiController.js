const prisma = require('../prismaClient');

/**
 * SmartRent TZ & NHC Knowledge Engine
 * Context-aware real estate intelligence for Tanzania.
 */
const smartRentKnowledge = `
Wewe ni "SmartRent AI" - Msaidizi Mahiri wa Kidijitali wa jukwaa la SmartRent TZ kwa ushirikiano na mifumo ya Shirika la Nyumba la Taifa (NHC) Tanzania.
Dhamira yako ni kuwasaidia wananchi, wapangaji, wamiliki wa nyumba, na mawakala kupata nyumba, kuelewa mifumo ya kiserikali (GePG & NIDA), kuripoti matengenezo, na kuelewa sheria za upangaji.

MAMBO MUHIMU UNAYOYAJUA:
1. MALIPO YA GePG (Control Numbers):
   - Kila ankara ya kodi hupewa Nambari ya Malipo ya Serikali ya tarakimu 12 inayoanza na 99 (mfano: 994200183921).
   - Mlipaji anaweza kulipa kupitia M-Pesa, Tigo Pesa, Airtel Money, Halopesa au benki zote za biashara (NMB, CRDB, NBC).
   - Baada ya kulipa, mfumo hutoa stakabadhi rasmi ya kielektroniki (E-Receipt) yenye nambari ya kumbukumbu (mfano: REC-2026-XXXX).

2. UHAKIKI WA NIDA:
   - Kila mpangaji anapaswa kuweka tarakimu 20 za Kitambulisho cha Taifa (NIN) kwenye profaili yake ili kuthibitishwa (NIDA Verified).
   - Hii inasaidia kuzuia upangishaji haramu (sub-leasing au madalali hewa).

3. MATENGENEZO YA NYUMBA (Maintenance Tickets):
   - Mpangaji anaweza kufungua tiketi kwenye mfumo kwa kuchagua kiwango cha dharura (Low, Medium, High, Urgent).
   - Msimamizi wa kanda wa NHC / Landlord anamgawia fundi aliyesajiliwa kazi hiyo na kuweka makadirio ya gharama.

4. MAENEO MAARUFU TANZANIA:
   - Dar es Salaam: Masaki, Mikocheni, Upanga, Kariakoo, Samora, Oysterbay, Kinondoni, Mbezi Beach, Sinza.
   - Dodoma: Medeli, Area D, Kisasa, Uzunguni, Mtumba.
   - Mikoa mingine: Arusha, Mwanza, Morogoro, Zanzibar.
`;

const handleAIChat = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Ujumbe unahitajika.' });
    }

    const lowerMessage = message.toLowerCase().trim();

    // 1. Check if user is searching for properties/housing
    const isSearchQuery = /natafuta|nyumba|chumba|chumba kimoja|vyumba|apartment|pango|kodi|rent|house|room|masaki|mikocheni|upanga|kariakoo|dodoma|arusha|mwanza|kinondoni/i.test(lowerMessage);

    let recommendedProperties = [];
    if (isSearchQuery) {
      // Query published properties from database
      const properties = await prisma.property.findMany({
        where: {
          status: 'PUBLISHED'
        },
        include: {
          units: true,
          images: { take: 1 }
        },
        take: 3
      });

      // Filter by location or budget if mentioned
      const filtered = properties.filter(p => {
        const text = `${p.title} ${p.address} ${p.region} ${p.district} ${p.propertyType}`.toLowerCase();
        // Check if any word from message matches property details
        const words = lowerMessage.split(/\s+/).filter(w => w.length > 3);
        const hasMatch = words.some(w => text.includes(w));
        return hasMatch || properties.length <= 3;
      });

      recommendedProperties = (filtered.length > 0 ? filtered : properties).slice(0, 3).map(p => ({
        id: p.id,
        title: p.title,
        location: `${p.district}, ${p.region}`,
        propertyType: p.propertyType,
        monthlyRent: p.units?.[0]?.monthlyRent || 0,
        imageUrl: p.images?.[0]?.url || null,
        availableUnits: p.units?.filter(u => u.status === 'AVAILABLE').length || 0
      }));
    }

    // 2. Formulate Contextual Intelligent Response
    let aiResponseText = '';

    if (/gepg|control number|namba ya malipo|jinsi ya kulipa|lipa kodi|m-pesa|tigopesa|airtel|nmb|crdb/i.test(lowerMessage)) {
      aiResponseText = `Habari! Ili kulipia kodi ya nyumba kupitia mfumo wetu:
1. Nenda kwenye **Tenant Dashboard** kisha chagua **Malipo (GePG)**.
2. Bonyeza **Pata GePG Control Number** kutoa namba ya tarakimu 12 (mfano: \`994200183921\`).
3. Lipa kupitia M-Pesa, Tigo Pesa, Airtel Money au App ya Benki (NMB/CRDB) kwa kuchagua **Lipa Bili / Malipo ya Serikali (GePG)**.
4. Mara tu malipo yanapokamilika, mfumo utakutumia stakabadhi rasmi ya kielektroniki (**E-Receipt**) papo hapo! 📄✨`;
    } 
    else if (/matengenezo|fundi|bomba|kuvuja|umeme|lifti|repair|maintenance|uharibifu/i.test(lowerMessage)) {
      aiResponseText = `Kuhusu Matengenezo ya Nyumba:
1. Fungua **Tenant Dashboard** na ubofye **Matengenezo (Tickets)**.
2. Bonyeza **Fungua Tiketi Mpya** na ueleze tatizo (mfano: Bomba linavuja, hitilafu ya taa).
3. Chagua kiwango cha dharura (**Low, Medium, High, au Urgent**).
4. Msimamizi wa kanda wa NHC au Mwenye Nyumba atamgawia fundi aliyesajiliwa kazi hiyo mara moja na utaweza kufuatilia hatua za utatuzi mtandaoni. 🛠️`;
    } 
    else if (/nida|kitambulisho|nin|uhakiki|verification/i.test(lowerMessage)) {
      aiResponseText = `Uhakiki wa Kitambulisho cha NIDA:
• Kila mpangaji anatakiwa kuweka tarakimu 20 za namba yake ya NIDA (NIN) kwenye ukurasa wa **Uhakiki wa NIDA**.
• Mfumo unahakiki namba hiyo ili kukupatia beji ya **NIDA Verified**.
• Hii inasaidia kujenga uaminifu na kuzuia madalali wasio rasmi na upangishaji haramu (*Illegal Sub-leasing*). 🛡️`;
    } 
    else if (/sheria|mkataba|deposit|amana|subleasing|kupangisha tena/i.test(lowerMessage)) {
      aiResponseText = `Kuhusu Mikataba na Sheria za Upangaji:
• Mkataba wote wa upangaji unawekwa kidijitali kwenye mfumo ukiwa na tarehe za kuanza, kuisha na kiasi cha kodi ya mwezi.
• **Tahadhari:** Ni marufuku kisheria kupangisha mtu mwingine kinyume cha sheria (*Sub-leasing*). Wanaoishi kwenye nyumba lazima wawe wamesajiliwa kwenye mfumo.
• Kodi zote za amana (*Security Deposits*) zinalindwa kwa mujibu wa mwongozo wa NHC na mkataba wa kisheria. 📜`;
    }
    else if (recommendedProperties.length > 0) {
      aiResponseText = `Nimepata machaguo mazuri ya nyumba yanayoweza kukufaa kulingana na ombi lako! Unaweza kutazama maelezo kamili ya kila nyumba hapa chini: 👇`;
    }
    else {
      aiResponseText = `Habari! Mimi ni **SmartRent AI**, msaidizi wako wa kidijitali wa huduma za nyumba na upangishaji (SmartRent TZ & NHC Portal).

Ninaweza kukusaidia katika:
• 🔍 **Kutafuta nyumba au ofisi za kupanga** kote nchini (Dar es Salaam, Dodoma, Arusha, Mwanza n.k.).
• 💳 **Mwongozo wa malipo ya kodi kwa GePG Control Numbers** na kupata risiti.
• 🛠️ **Kuripoti hitilafu na kufungua tiketi za matengenezo**.
• 📜 **Kuelewa sheria za mikataba ya upangaji na uhakiki wa NIDA**.

Je, ungependa nikusaidie nini leo?`;
    }

    res.json({
      success: true,
      data: {
        reply: aiResponseText,
        properties: recommendedProperties,
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { handleAIChat };
