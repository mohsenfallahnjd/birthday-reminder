import { Link } from "@/components/link";
import { Icon } from "@/components/icon";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex justify-around opacity-40">
        {["🎂", "🎈", "🎁", "✨", "🎉"].map((emoji, i) => (
          <span
            key={emoji}
            className="confetti-dot text-4xl"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-party-fuchsia shadow-md">
          <Icon name="sparkles" size={16} />
          تقویم شمسی · گروه · لیست آرزو · پرداخت گروهی
        </div>

        <h1 className="text-4xl font-extrabold leading-tight text-party-ink sm:text-5xl">
          تولدها را فراموش نکن،
          <br />
          <span className="bg-gradient-to-l from-party-pink via-party-fuchsia to-party-purple bg-clip-text text-transparent">
            هدیه را با هم جمع کن
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-party-ink/70">
          تاریخ تولد شمسی ثبت کن، گروه بساز یا دوستان را دعوت کن، برای هر جشن لیست
          آرزو بگذار و با ادمین مالی، پرداخت‌ها را با رسید تأیید کن. هر مبلغی که
          بتوانی کافی است!
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {session ? (
            <Link href="/dashboard" variant="button" className="text-base px-8 py-3">
              برو به داشبورد
            </Link>
          ) : (
            <>
              <Link href="/register" variant="button" className="text-base px-8 py-3">
                شروع رایگان
              </Link>
              <Link href="/login" variant="ghost">
                ورود
              </Link>
            </>
          )}
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3 text-right">
          {[
            {
              icon: "calendar" as const,
              title: "تقویم شمسی",
              desc: "انتخاب روز و ماه تولد با date picker فارسی",
            },
            {
              icon: "users" as const,
              title: "گروه و دوستان",
              desc: "دعوت با لینک یا اضافه کردن افراد و نوتیفیکیشن",
            },
            {
              icon: "gift" as const,
              title: "لیست آرزو و پول جمعی",
              desc: "قیمت، لینک، cheap-in، رسید و تأیید ادمین",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-lg backdrop-blur"
            >
              <Icon name={f.icon} size={28} className="mb-3" />
              <h3 className="font-bold text-party-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-party-ink/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
