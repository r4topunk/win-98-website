export function TextNoteViewer() {
  const franciscoText = `Francisco H. ou franciscoskt é um artista nascido na capital de São paulo, onde nasceu e desenvolveu sua arte, começou a desenhar com 8 anos de idade e nunca mais parou.

Autodidata, sempre explorou inúmeras atividades como o skate, possuindo atualmente alguns filmes produzidos por si mesmo. Possui com orgulho, em seu currículo, exposições realizadas em São Paulo (coletiva), Barcelona (solo), graças aos amigos e admiradores de seu trabalho que, desde o princípio da trajetória revelou forte identidade. Desenvolveu também diversas capas de discos e singles para artistas nacionais e internacionais sempre unindo a assinatura do artista a sua própria. 

Além de centenas de telas e tatuagens disseminadas pelo Brasil afora, produziu também diversas estampas em serigrafia onde criou várias peças únicas, assim como graffitis em espaços públicos. 

Buscando sempre mesclar tudo isso em seus filmes, trazendo experiências artísticas diversas com skate e outras coisas do dia-a-dia não se sabe qual será o próximo passo pois está sempre em movimento.`

  return (
    <div className="w-full h-full p-4 overflow-y-auto bg-white">
      <div className="max-w-full">
        <div className="text-base font-['Pixelated MS Sans Serif'] leading-relaxed whitespace-pre-wrap">
          {franciscoText}
        </div>
      </div>
    </div>
  )
}