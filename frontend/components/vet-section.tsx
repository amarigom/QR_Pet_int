'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  QrCode,
  ShieldCheck,
  Stethoscope,
  UserPlus,
} from 'lucide-react'

const STEPS = [
  {
    icon: UserPlus,
    title: 'Sumá a tu cliente',
    text: 'Cargás sus datos y le llega por WhatsApp un enlace para activar su cuenta.',
  },
  {
    icon: QrCode,
    title: 'El dueño te vincula',
    text: 'Desde la ficha de su mascota elige tu clínica. Vos escaneás la medalla y abrís la ficha.',
  },
  {
    icon: ClipboardList,
    title: 'Registrás la consulta',
    text: 'Motivo, diagnóstico, tratamiento, peso y temperatura quedan en un historial paginado.',
  },
]

const FEATURES = [
  {
    icon: Stethoscope,
    title: 'Historia clínica digital',
    text: 'Creá, editá y exportá consultas. La historia acompaña a la mascota aunque cambie la medalla.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda con recordatorios',
    text: 'Turnos semanales y avisos por WhatsApp para que tus pacientes no falten.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacidad por clínica',
    text: 'Cada clínica ve solo lo que ella registró y únicamente de las mascotas vinculadas.',
  },
]

export default function VetSection() {
  return (
    <section id="veterinarias" className="py-20 bg-background scroll-mt-24 border-t border-border">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Stethoscope className="h-3.5 w-3.5" />
            Para veterinarias
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Una medalla, la historia clínica completa
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Menos papeles traspapelados: escaneás la medalla y trabajás sobre la ficha de tu paciente.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="absolute right-5 top-4 text-4xl font-bold text-primary/15">{i + 1}</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-muted/30 p-6 transition-colors hover:border-primary/40"
            >
              <Icon className="h-6 w-6 text-secondary-foreground" />
              <h3 className="mt-3 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Quiero sumar mi veterinaria
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-accent"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  )
}
