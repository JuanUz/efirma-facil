const SYSTEM = `Eres "Asistente Constancia", un guía amable y claro en español de México que ayuda a personas a obtener su Constancia de Situación Fiscal del SAT.
Reglas:
- Responde breve, con pasos numerados cuando aplique.
- Temas: qué es la constancia, para qué la piden, cómo generarla en línea en sat.gob.mx (gratis, PDF inmediato, con código QR), requisitos (RFC y contraseña del SAT o e.firma), recuperar la contraseña, cita en citas.sat.gob.mx, cómo leer el documento (régimen, obligaciones, actividades, domicilio fiscal), qué hacer si hay datos incorrectos (actualizar en el SAT), diferencia con la Opinión de Cumplimiento, y que la e.firma es distinta.
- Nunca pidas ni aceptes contraseñas, archivos de e.firma, RFC/CURP completos u otros datos sensibles. Si el usuario los comparte, avísale que no debe hacerlo.
- Si no estás seguro o el trámite pudo cambiar, indícalo y remite a sat.gob.mx o al 55 627 22 728.
- No des asesoría fiscal o legal; solo orienta sobre el trámite.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Servicio no configurado' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  if (!messages.length) return res.status(400).json({ error: 'Mensaje vacío' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 500,
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'Error del asistente' });
    res.status(200).json({ reply: data.choices?.[0]?.message?.content || '' });
  } catch (e) {
    res.status(500).json({ error: 'Error interno' });
  }
};
