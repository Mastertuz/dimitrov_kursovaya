import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold text-sm mb-4">О компании</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  О нас
                </Link>
              </li>
              <li>
                <Link
                  href="/contacts"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Контакты
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Вакансии
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Помощь</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/delivery"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Доставка и оплата
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Возврат и обмен
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Частые вопросы
                </Link>
              </li>
              <li>
                <Link
                  href="/sizes"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Таблица размеров
                </Link>
              </li>
            </ul>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Каталог</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/catalog?gender=male"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Мужчинам
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?gender=female"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Женщинам
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?gender=kids"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Детям
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?sale=true"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Распродажа
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Связаться с нами</h3>
            <ul className="space-y-2.5">
              <li className="text-sm text-muted-foreground">
                8 (800) 123-45-67
              </li>
              <li className="text-sm text-muted-foreground">
                info@shop-clothes.ru
              </li>
              <li className="text-sm text-muted-foreground">
                Пн-Вс: 09:00 - 21:00
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[8px]">
                MO
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {"Магазин Одежды \u00A9 2026. Все права защищены."}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Пользовательское соглашение
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
