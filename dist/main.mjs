import {canonicalize,IconvTiny,SBCS,Unicode} from "../src/index.mjs";
//import {canonicalize,IconvTiny,SBCS,Unicode} from "./cc.mjs";
export {canonicalize,IconvTiny,SBCS,Unicode};
export const
ISO_8859_1=new SBCS("ISO-8859-1",""),
ISO_8859_2=new SBCS("ISO-8859-2","Ą˘Ł¤ĽŚ§¨ŠŞŤŹ­ŽŻ°ą˛ł´ľśˇ¸šşťź˝žżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙"),
ISO_8859_3=new SBCS("ISO-8859-3","ŭŝ˙","¡Ħ¢˘¥�¦Ĥ©İªŞ«Ğ¬Ĵ®�¯Ż±ħ¶ĥ¹ıºş»ğ¼ĵ¾�¿żÃ�ÅĊÆĈÐ�ÕĠØĜÝŬÞŜã�åċæĉð�õġøĝ"),
ISO_8859_4=new SBCS("ISO-8859-4","ĄĸŖ¤ĨĻ§¨ŠĒĢŦ­Ž¯°ą˛ŗ´ĩļˇ¸šēģŧŊžŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎĪĐŅŌĶÔÕÖ×ØŲÚÛÜŨŪßāáâãäåæįčéęëėíîīđņōķôõö÷øųúûüũū˙"),
ISO_8859_5=new SBCS("ISO-8859-5","ЁЂЃЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђѓєѕіїјљњћќ§ўџ"),
ISO_8859_6=new SBCS("ISO-8859-6","���¤�������،­�������������؛���؟�ءآأؤإئابةتثجحخدذرزسشصضطظعغ�����ـفقكلمنهوىيًٌٍَُِّْ�������������"),
ISO_8859_7=new SBCS("ISO-8859-7","΄΅Ά·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�","¡‘¢’¤€¥₯ªͺ®�¯―"),
ISO_8859_8=new SBCS("ISO-8859-8","��������������������������������‗אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�","¡�ª×º÷"),
ISO_8859_9=new SBCS("ISO-8859-9","ışÿ","ÐĞÝİÞŞðğ"),
ISO_8859_10=new SBCS("ISO-8859-10","ĸ","¡Ą¢Ē£Ģ¤Ī¥Ĩ¦Ķ¨Ļ©ĐªŠ«Ŧ¬Ž®Ū¯Ŋ±ą²ē³ģ´īµĩ¶ķ¸ļ¹đºš»ŧ¼ž½―¾ū¿ŋÀĀÇĮÈČÊĘÌĖÑŅÒŌ×ŨÙŲàāçįèčêęìėñņòō÷ũùų"),
ISO_8859_11=new SBCS("ISO-8859-11","กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"),
ISO_8859_13=new SBCS("ISO-8859-13","æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž’","¡”¥„¨ØªŖ¯Æ´“¸øºŗ"),
ISO_8859_14=new SBCS("ISO-8859-14","ŷÿ","¡Ḃ¢ḃ¤Ċ¥ċ¦Ḋ¨ẀªẂ«ḋ¬Ỳ¯Ÿ°Ḟ±ḟ²Ġ³ġ´Ṁµṁ·Ṗ¸ẁ¹ṗºẃ»Ṡ¼ỳ½Ẅ¾ẅ¿ṡÐŴ×ṪÞŶðŵ÷ṫ"),
ISO_8859_15=new SBCS("ISO-8859-15","","¤€¦Š¨š´Ž¸ž¼Œ½œ¾Ÿ"),
ISO_8859_16=new SBCS("ISO-8859-16","ęțÿ","¡Ą¢ą£Ł¤€¥„¦Š¨šªȘ¬Ź®ź¯Ż²Č³ł´Žµ”¸ž¹čºș¼Œ½œ¾Ÿ¿żÃĂÅĆÐĐÑŃÕŐ×ŚØŰÝĘÞȚãăåćðđñńõő÷śøű"),
CP037=new SBCS("CP037","\t\x7F\v\f\r\n \xA0âäàáãåçñ¢.<(+|&éêëèíîïìß!$*);¬-/ÂÄÀÁÃÅÇÑ¦,%_>?øÉÊËÈÍÎÏÌ`:#@'=\"Øabcdefghi«»ðýþ±°jklmnopqrªºæ¸Æ¤µ~stuvwxyz¡¿ÐÝÞ®^£¥·©§¶¼½¾[]¯¨´×{ABCDEFGHI­ôöòóõ}JKLMNOPQR¹ûüùúÿ\\÷STUVWXYZ²ÔÖÒÓÕ0123456789³ÛÜÙÚ"),
CP500=new SBCS("CP500","\t\x7F\v\f\r\n \xA0âäàáãåçñ[.<(+!&éêëèíîïìß]$*);^-/ÂÄÀÁÃÅÇÑ¦,%_>?øÉÊËÈÍÎÏÌ`:#@'=\"Øabcdefghi«»ðýþ±°jklmnopqrªºæ¸Æ¤µ~stuvwxyz¡¿ÐÝÞ®¢£¥·©§¶¼½¾¬|¯¨´×{ABCDEFGHI­ôöòóõ}JKLMNOPQR¹ûüùúÿ\\÷STUVWXYZ²ÔÖÒÓÕ0123456789³ÛÜÙÚ"),
CP875=new SBCS("CP875","\t\x7F\v\f\r\n ΑΒΓΔΕΖΗΘΙ[.<(+!&ΚΛΜΝΞΟΠΡΣ]$*);^-/ΤΥΦΧΨΩΪΫ|,%_>?¨ΆΈΉ\xA0ΊΌΎΏ`:#@'=\"΅abcdefghiαβγδεζ°jklmnopqrηθικλμ´~stuvwxyzνξοπρσ£άέήϊίόύϋώςτυφχψ{ABCDEFGHI­ωΐΰ‘―}JKLMNOPQR±½�·’¦\\₯STUVWXYZ²§ͺ�«¬0123456789³©€�»"),
CP1026=new SBCS("CP1026","\t\x7F\v\f\r\n \xA0âäàáãå{ñÇ.<(+!&éêëèíîïìßĞİ*);^-/ÂÄÀÁÃÅ[Ñş,%_>?øÉÊËÈÍÎÏÌı:ÖŞ'=ÜØabcdefghi«»}`¦±°jklmnopqrªºæ¸Æ¤µöstuvwxyz¡¿]$@®¢£¥·©§¶¼½¾¬|¯¨´×çABCDEFGHI­ô~òóõğJKLMNOPQR¹û\\ùúÿü÷STUVWXYZ²Ô#ÒÓÕ0123456789³Û\"ÙÚ"),
CP437=new SBCS("CP437","ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\xA0"),
CP737=new SBCS("CP737","ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρσςτυφχψ░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀ωάέήϊίόύϋώΆΈΉΊΌΎΏ±≥≤ΪΫ÷≈°∙·√ⁿ²■\xA0"),
CP775=new SBCS("CP775","ĆüéāäģåćłēŖŗīŹÄÅÉæÆōöĢ¢ŚśÖÜø£Ø×¤ĀĪóŻżź”¦©®¬½¼Ł«»░▒▓│┤ĄČĘĖ╣║╗╝ĮŠ┐└┴┬├─┼ŲŪ╚╔╩╦╠═╬Žąčęėįšųūž┘┌█▄▌▐▀ÓßŌŃõÕµńĶķĻļņĒŅ’­±“¾¶§÷„°∙·¹³²■\xA0"),
CP850=new SBCS("CP850","ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■\xA0"),
CP852=new SBCS("CP852","ÇüéâäůćçłëŐőîŹÄĆÉĹĺôöĽľŚśÖÜŤťŁ×čáíóúĄąŽžĘę¬źČş«»░▒▓│┤ÁÂĚŞ╣║╗╝Żż┐└┴┬├─┼Ăă╚╔╩╦╠═╬¤đĐĎËďŇÍÎě┘┌█▄ŢŮ▀ÓßÔŃńňŠšŔÚŕŰýÝţ´­˝˛ˇ˘§÷¸°¨˙űŘř■\xA0"),
CP855=new SBCS("CP855","ђЂѓЃёЁєЄѕЅіІїЇјЈљЉњЊћЋќЌўЎџЏюЮъЪаАбБцЦдДеЕфФгГ«»░▒▓│┤хХиИ╣║╗╝йЙ┐└┴┬├─┼кК╚╔╩╦╠═╬¤лЛмМнНоОп┘┌█▄Пя▀ЯрРсСтТуУжЖвВьЬ№­ыЫзЗшШэЭщЩчЧ§■\xA0"),
CP857=new SBCS("CP857","ÇüéâäàåçêëèïîıÄÅÉæÆôöòûùİÖÜø£ØŞşáíóúñÑĞğ¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ºªÊËÈ�ÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµ�×ÚÛÙìÿ¯´­±�¾¶§÷¸°¨·¹³²■\xA0"),
CP860=new SBCS("CP860","ÇüéâãàÁçêÊèÍÔìÃÂÉÀÈôõòÚùÌÕÜ¢£Ù₧ÓáíóúñÑªº¿Ò¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\xA0"),
CP861=new SBCS("CP861","ÇüéâäàåçêëèÐðÞÄÅÉæÆôöþûÝýÖÜø£Ø₧ƒáíóúÁÍÓÚ¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\xA0"),
CP862=new SBCS("CP862","אבגדהוזחטיךכלםמןנסעףפץצקרשת¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\xA0"),
CP863=new SBCS("CP863","ÇüéâÂà¶çêëèïî‗À§ÉÈÊôËÏûù¤ÔÜ¢£ÙÛƒ¦´óú¨¸³¯Î⌐¬½¼¾«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\xA0"),
CP864=new SBCS("CP864","°·∙√▒─│┼┤┬├┴┐┌└┘β∞φ±½¼≈«»ﻷﻸ��ﻻﻼ�\xA0­ﺂ£¤ﺄ��ﺎﺏﺕﺙ،ﺝﺡﺥ٠١٢٣٤٥٦٧٨٩ﻑ؛ﺱﺵﺹ؟¢ﺀﺁﺃﺅﻊﺋﺍﺑﺓﺗﺛﺟﺣﺧﺩﺫﺭﺯﺳﺷﺻﺿﻁﻅﻋﻏ¦¬÷×ﻉـﻓﻗﻛﻟﻣﻧﻫﻭﻯﻳﺽﻌﻎﻍﻡﹽّﻥﻩﻬﻰﻲﻐﻕﻵﻶﻝﻙﻱ■�","%٪"),
CP865=new SBCS("CP865","ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø₧ƒáíóúñÑªº¿⌐¬½¼¡«¤░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\xA0"),
CP866=new SBCS("CP866","АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№¤■\xA0"),
CP869=new SBCS("CP869","������Ά�·¬¦‘’Έ―ΉΊΪΌ��ΎΫ©Ώ²³ά£έήίϊΐόύΑΒΓΔΕΖΗ½ΘΙ«»░▒▓│┤ΚΛΜΝ╣║╗╝ΞΟ┐└┴┬├─┼ΠΡ╚╔╩╦╠═╬ΣΤΥΦΧΨΩαβγ┘┌█▄δε▀ζηθικλμνξοπρσςτ΄­±υφχ§ψ΅°¨ωϋΰώ■\xA0"),
CP874=new SBCS("CP874","€����…�����������‘’“”•–—��������\xA0กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"),
CP1250=new SBCS("CP1250","€�‚�„…†‡�‰Š‹ŚŤŽŹ�‘’“”•–—�™š›śťžź\xA0ˇ˘Ł¤Ą¦§¨©Ş«¬­®Ż°±˛ł´µ¶·¸ąş»Ľ˝ľżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙"),
CP1251=new SBCS("CP1251","ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—�™љ›њќћџ\xA0ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"),
CP1252=new SBCS("CP1252","","€�‚ƒ„…†‡ˆ‰Š‹Œ�Ž��‘’“”•–—˜™š›œ�žŸ"),
CP1253=new SBCS("CP1253","€�‚ƒ„…†‡�‰�‹�����‘’“”•–—�™�›����\xA0΅Ά£¤¥¦§¨©�«¬­®―°±²³΄µ¶·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�"),
CP1254=new SBCS("CP1254","ışÿ","€�‚ƒ„…†‡ˆ‰Š‹Œ����‘’“”•–—˜™š›œ��ŸÐĞÝİÞŞðğ"),
CP1255=new SBCS("CP1255","€�‚ƒ„…†‡ˆ‰�‹�����‘’“”•–—˜™�›����\xA0¡¢£₪¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾¿ְֱֲֳִֵֶַָֹֺֻּֽ־ֿ׀ׁׂ׃װױײ׳״�������אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�"),
CP1256=new SBCS("CP1256","€پ‚ƒ„…†‡ˆ‰ٹ‹Œچژڈگ‘’“”•–—ک™ڑ›œ‌‍ں\xA0،¢£¤¥¦§¨©ھ«¬­®¯°±²³´µ¶·¸¹؛»¼½¾؟ہءآأؤإئابةتثجحخدذرزسشصض×طظعغـفقكàلâمنهوçèéêëىيîïًٌٍَôُِ÷ّùْûü‎‏ے"),
CP1257=new SBCS("CP1257","€�‚�„…†‡�‰�‹�¨ˇ¸�‘’“”•–—�™�›�¯˛�\xA0�¢£¤�¦§Ø©Ŗ«¬­®Æ°±²³´µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž˙"),
CP1258=new SBCS("CP1258","ư₫ÿ","€�‚ƒ„…†‡ˆ‰�‹Œ����‘’“”•–—˜™�›œ��ŸÃĂÌ̀ÐĐÒ̉ÕƠÝƯÞ̃ãăì́ðđọ̀õơ"),
MAC_CYRILLIC=new SBCS("MAC-CYRILLIC","АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°¢£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµ∂ЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»…\xA0ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю¤"),
MAC_GREEK=new SBCS("MAC-GREEK","Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦­ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»…\xA0ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ�"),
MAC_ICELAND=new SBCS("MAC-ICELAND","ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»…\xA0ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"),
MAC_LATIN2=new SBCS("MAC-LATIN2","ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»…\xA0ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ"),
MAC_ROMAN=new SBCS("MAC-ROMAN","ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»…\xA0ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"),
MAC_TURKISH=new SBCS("MAC-TURKISH","ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»…\xA0ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙ�ˆ˜¯˘˙˚¸˝˛ˇ"),
ATARIST=new SBCS("ATARIST","ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥ßƒáíóúñÑªº¿⌐¬½¼¡«»ãõØøœŒÀÃÕ¨´†¶©®™ĳĲאבגדהוזחטיכלמנסעפצקרשתןךםףץ§∧∞αβΓπΣσµτΦΘΩδ∮φ∈∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²³¯"),
CP424=new SBCS("CP424","\t\x7F\v\f\r\n אבגדהוזחט¢.<(+|&יךכלםמןנס!$*);¬-/עףפץצקרש¦,%_>?pתrs\xA0uvw‗`:#@'=\"�abcdefghi«»���±°jklmnopqr���¸�¤µ~stuvwxyz�����®^£¥·©§¶¼½¾[]¯¨´×{ABCDEFGHI­�����}JKLMNOPQR¹�����\\÷STUVWXYZ²�����0123456789³����"),
CP856=new SBCS("CP856","אבגדהוזחטיךכלםמןנסעףפץצקרשת�£�×����������®¬½¼�«»░▒▓│┤���©╣║╗╝¢¥┐└┴┬├─┼��╚╔╩╦╠═╬¤���������┘┌█▄¦�▀������µ�������¯´­±‗¾¶§÷¸°¨·¹³²■\xA0"),
CP1006=new SBCS("CP1006","۰۱۲۳۴۵۶۷۸۹،؛­؟ﺁﺍﺎﺎﺏﺑﭖﭘﺓﺕﺗﭦﭨﺙﺛﺝﺟﭺﭼﺡﺣﺥﺧﺩﮄﺫﺭﮌﺯﮊﺱﺳﺵﺷﺹﺻﺽﺿﻁﻅﻉﻊﻋﻌﻍﻎﻏﻐﻑﻓﻕﻗﻙﻛﮒﮔﻝﻟﻠﻡﻣﮞﻥﻧﺅﻭﮦﮨﮩﮪﺀﺉﺊﺋﻱﻲﻳﮰﮮﹼﹽ"),
KOI8_R=new SBCS("KOI8-R","─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥\xA0⌡°²·÷═║╒ё╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡Ё╢╣╤╥╦╧╨╩╪╫╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"),
KOI8_U=new SBCS("KOI8-U","─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥\xA0⌡°²·÷═║╒ёє╔ії╗╘╙╚╛ґ╝╞╟╠╡ЁЄ╣ІЇ╦╧╨╩╪Ґ╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"),
KZ1048=new SBCS("KZ1048","ЂЃ‚ѓ„…†‡€‰Љ‹ЊҚҺЏђ‘’“”•–—�™љ›њқһџ\xA0ҰұӘ¤Ө¦§Ё©Ғ«¬­®Ү°±Ііөµ¶·ё№ғ»әҢңүАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"),
NEXTSTEP=new SBCS("NEXTSTEP","\xA0ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞµ×÷©¡¢£⁄¥ƒ§¤’“«‹›ﬁﬂ®–†‡·¦¶•‚„”»…‰¬¿¹ˋ´ˆ˜¯˘˙¨²˚¸³˝˛ˇ—±¼½¾àáâãäåçèéêëìÆíªîïðñŁØŒºòóôõöæùúûıüýłøœßþÿ��"),
US_ASCII=new SBCS("US-ASCII","�".repeat(128)),
UTF8=new Unicode(2,2),
UTF16LE=new Unicode(0,0),
UTF16BE=new Unicode(0,1),
UTF32LE=new Unicode(1,0),
UTF32BE=new Unicode(1,1),
encodings={ISO_8859_1,ISO_8859_2,ISO_8859_3,ISO_8859_4,ISO_8859_5,ISO_8859_6,ISO_8859_7,ISO_8859_8,ISO_8859_9,ISO_8859_10,ISO_8859_11,ISO_8859_13,ISO_8859_14,ISO_8859_15,ISO_8859_16,CP037,CP500,CP875,CP1026,CP437,CP737,CP775,CP850,CP852,CP855,CP857,CP860,CP861,CP862,CP863,CP864,CP865,CP866,CP869,CP874,CP1250,CP1251,CP1252,CP1253,CP1254,CP1255,CP1256,CP1257,CP1258,MAC_CYRILLIC,MAC_GREEK,MAC_ICELAND,MAC_LATIN2,MAC_ROMAN,MAC_TURKISH,ATARIST,CP424,CP856,CP1006,KOI8_R,KOI8_U,KZ1048,NEXTSTEP,US_ASCII,UTF8,UTF16LE,UTF16BE,UTF32LE,UTF32BE},
aliases="ISO-8859-1 819 88591 cp819 csisolatin1 ibm819 isoir100 l1 latin1,ISO-8859-2 88592 912 cp912 csisolatin2 ibm912 isoir101 l2 latin2,ISO-8859-3 88593 913 cp913 csisolatin3 ibm913 isoir109 l3 latin3,ISO-8859-4 88594 914 cp914 csisolatin4 ibm914 isoir110 l4 latin4,ISO-8859-5 88595 915 cp915 csisolatincyrillic cyrillic ibm915 isoir144,ISO-8859-6 1089 88596 arabic asmo708 cp1089 csisolatinarabic ecma114 ibm1089 isoir127,ISO-8859-7 813 88597 cp813 csisolatingreek ecma118 elot928 greek greek8 ibm813 isoir126 suneugreek,ISO-8859-8 88598 916 cp916 csisolatinhebrew hebrew ibm916 isoir138,ISO-8859-9 88599 920 cp920 csisolatin5 ibm920 isoir148 l5 latin5,ISO-8859-10 csisolatin6 isoir157 l6 latin6,ISO-8859-11 xiso885911,ISO-8859-13 885913,ISO-8859-14 isoceltic isoir199 l8 latin8,ISO-8859-15 885915 923 cp923 csiso885915 csisolatin csisolatin9 ibm923 iso885915fdis l9 latin latin9,ISO-8859-16 csiso885916 iso8859162001 isoir226 l10 latin10,CP037 37 cpibm37 csebcdiccpca csebcdiccpnl csebcdiccpus csebcdiccpwt csibm37 ebcdiccpca ebcdiccpnl ebcdiccpus ebcdiccpwt ibm37,CP500 500 csibm500 ebcdiccpbh ebcdiccpch ibm500,CP875 875 ibm875 xibm875,CP1026 1026 ibm1026,CP437 437 cspc8codepage437 ibm437 windows437,CP737 737 ibm737 xibm737,CP775 775 ibm775,CP850 850 cspc850multilingual ibm850,CP852 852 cspcp852 ibm852,CP855 855 cspcp855 ibm855,CP857 857 csibm857 ibm857,CP860 860 csibm860 ibm860,CP861 861 cpis csibm861 ibm861,CP862 862 csibm862 cspc862latinhebrew ibm862,CP863 863 csibm863 ibm863,CP864 864 csibm864 ibm864,CP865 865 csibm865 ibm865,CP866 866 csibm866 ibm866,CP869 869 cpgr csibm869 ibm869,CP874 874 ibm874 xibm874,CP1250 cp5346 win1250 windows1250,CP1251 ansi1251 cp5347 win1251 windows1251,CP1252 cp5348 ibm1252 win1252 windows1252,CP1253 cp5349 win1253 windows1253,CP1254 cp5350 win1254 windows1254,CP1255 win1255 windows1255,CP1256 win1256 windows1256,CP1257 cp5353 win1257 windows1257,CP1258 win1258 windows1258,MAC-CYRILLIC xmaccyrillic,MAC-GREEK xmacgreek,MAC-ICELAND xmaciceland,MAC-LATIN2 maccentraleurope xmaccentraleurope,MAC-ROMAN xmacroman,MAC-TURKISH xmacturkish,ATARIST,CP424 424 csibm424 ebcdiccphe ibm424,CP856 856 ibm856 xibm856,CP1006 1006 ibm1006 xibm1006,KOI8-R cskoi8r koi8,KOI8-U cskoi8u,KZ1048 cskz1048 rk1048 strk10482002,NEXTSTEP we8nextstep,US-ASCII 646 ansix34 ascii ascii7 cp367 csascii default ibm367 iso646irv iso646us isoir6 us,UTF8 unicode11utf8,UTF16LE utf16,UTF16BE,UTF32LE utf32,UTF32BE";
