import { useState } from "react"

export function TextNoteViewer() {
  const [language, setLanguage] = useState<'pt' | 'en' | 'jp'>('pt')

  const translations = {
    pt: `Francisco H. ou franciscoskt é um artista nascido na capital de São paulo, onde nasceu e desenvolveu sua arte, começou a desenhar com 8 anos de idade e nunca mais parou.

Autodidata, sempre explorou inúmeras atividades como o skate, possuindo atualmente alguns filmes produzidos por si mesmo. Possui com orgulho, em seu currículo, exposições realizadas em São Paulo (coletiva), Barcelona (solo), graças aos amigos e admiradores de seu trabalho que, desde o princípio da trajetória revelou forte identidade. Desenvolveu também diversas capas de discos e singles para artistas nacionais e internacionais sempre unindo a assinatura do artista a sua própria. 

Além de centenas de telas e tatuagens disseminadas pelo Brasil afora, produziu também diversas estampas em serigrafia onde criou várias peças únicas, assim como graffitis em espaços públicos. 

Buscando sempre mesclar tudo isso em seus filmes, trazendo experiências artísticas diversas com skate e outras coisas do dia-a-dia não se sabe qual será o próximo passo pois está sempre em movimento.`,

    en: `Francisco H. or franciscoskt is an artist born in the capital of São Paulo, where he was born and developed his art. He started drawing at 8 years old and never stopped.

Self-taught, he has always explored numerous activities such as skateboarding, currently having some films produced by himself. He proudly holds in his resume exhibitions held in São Paulo (group), Barcelona (solo), thanks to friends and admirers of his work who, from the beginning of his trajectory, revealed a strong identity. He has also developed various album covers and singles for national and international artists, always combining the artist's signature with his own.

In addition to hundreds of canvases and tattoos spread throughout Brazil, he has also produced various screen printing designs where he created several unique pieces, as well as graffiti in public spaces.

Always seeking to blend all of this in his films, bringing diverse artistic experiences with skateboarding and other everyday things, no one knows what the next step will be because he is always in motion.`,

    jp: `Francisco H.またはfranciscosktは、サンパウロの首都で生まれ、そこで芸術を発展させたアーティストです。8歳で絵を描き始め、それ以来止まることはありませんでした。

独学で、スケートボードなど数多くの活動を常に探求しており、現在は自分で制作した映画をいくつか持っています。軌跡の初期から強いアイデンティティを明らかにした作品の友人や賞賛者のおかげで、サンパウロ（グループ）、バルセロナ（ソロ）で開催された展示会を履歴書に誇らしく持っています。また、国内外のアーティストのためのアルバムカバーやシングルも数多く手がけ、常にアーティストのサインと自分のサインを融合させています。

ブラジル全土に広がる数百のキャンバスやタトゥーに加えて、いくつかのユニークな作品を生み出したスクリーンプリントデザインや、公共スペースでのグラフィティも制作しています。

常に映画でこれらすべてを融合することを求め、スケートボードや日常の他のことで多様な芸術的体験をもたらし、彼は常に動いているため、次のステップが何かは誰にもわかりません。`
  }

  return (
    <div className="w-full h-full p-4 overflow-y-auto bg-white">
      <div className="max-w-full">
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setLanguage('pt')}
            className={`px-3 py-1 text-xs font-['Pixelated MS Sans Serif'] border border-gray-400 ${
              language === 'pt' 
                ? 'bg-blue-200 border-blue-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            PT
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-['Pixelated MS Sans Serif'] border border-gray-400 ${
              language === 'en' 
                ? 'bg-blue-200 border-blue-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('jp')}
            className={`px-3 py-1 text-xs font-['Pixelated MS Sans Serif'] border border-gray-400 ${
              language === 'jp' 
                ? 'bg-blue-200 border-blue-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            JP
          </button>
        </div>
        <div className="text-base font-['Pixelated MS Sans Serif'] leading-relaxed whitespace-pre-wrap">
          {translations[language]}
        </div>
      </div>
    </div>
  )
}