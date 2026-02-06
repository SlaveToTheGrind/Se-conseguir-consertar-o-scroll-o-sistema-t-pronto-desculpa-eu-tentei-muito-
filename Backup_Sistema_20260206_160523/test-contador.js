// Cole isso no console do navegador (F12 > Console)

console.log('🔍 TESTE DO CONTADOR');
console.log('1. Elemento existe?', !!document.getElementById('totalAgendamentos'));
console.log('2. Valor atual:', document.getElementById('totalAgendamentos')?.textContent);
console.log('3. Styles aplicados:', window.getComputedStyle(document.getElementById('totalAgendamentos')));
console.log('4. currentAppointments:', currentAppointments.length);

// Forçar atualização MANUAL
const elem = document.getElementById('totalAgendamentos');
if (elem) {
    const pendentes = currentAppointments.filter(a => !a.status || a.status === 'pendente' || a.status === 'agendado');
    console.log('5. Pendentes:', pendentes.length);
    
    elem.textContent = pendentes.length;
    elem.style.color = 'red';
    elem.style.fontSize = '3rem';
    elem.style.fontWeight = 'bold';
    
    console.log('6. Valor depois de forçar:', elem.textContent);
} else {
    console.error('❌ Elemento não encontrado!');
}
