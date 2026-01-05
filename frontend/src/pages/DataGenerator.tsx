import { useState, useCallback } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  Copy, 
  Check,
  RefreshCw,
  Globe,
  User,
  UserCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

type DataType = 'name' | 'phone' | 'email';
type Gender = 'male' | 'female' | 'random';

interface GeneratedItem {
  id: string;
  type: DataType;
  value: string;
  copied: boolean;
}

// База данных имён по странам и полу
const NAMES_DATABASE: Record<string, { male: { first: string[], last: string[] }, female: { first: string[], last: string[] } }> = {
  EC: { // Эквадор
    male: {
      first: ['Carlos', 'José', 'Luis', 'Miguel', 'Juan', 'Andrés', 'Diego', 'Fernando', 'Ricardo', 'Pablo', 'Sebastián', 'Alejandro', 'Daniel', 'Gabriel', 'Mauricio', 'Javier', 'Edison', 'Byron', 'Cristian', 'Ángel', 'Marco', 'Héctor', 'Fabián', 'Patricio', 'Xavier', 'Julio', 'César', 'Víctor', 'Esteban', 'Gonzalo', 'Iván', 'Raúl', 'Alfredo', 'Hugo', 'Leonardo'],
      last: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Morales', 'Reyes', 'Cruz', 'Ortiz', 'Gutiérrez', 'Chávez', 'Romero', 'Vargas', 'Mendoza', 'Ruiz', 'Álvarez', 'Castillo', 'Jiménez', 'Moreno', 'Paredes', 'Aguirre', 'Vega', 'Ramos', 'Medina', 'Suárez', 'Herrera']
    },
    female: {
      first: ['María', 'Ana', 'Lucía', 'Carmen', 'Rosa', 'Patricia', 'Gabriela', 'Andrea', 'Daniela', 'Valentina', 'Sofía', 'Isabella', 'Camila', 'Fernanda', 'Paola', 'Diana', 'Verónica', 'Adriana', 'Mónica', 'Carolina', 'Lorena', 'Silvia', 'Karla', 'Jessica', 'Karina', 'Alexandra', 'Marcela', 'Sandra', 'Elizabeth', 'Estefanía', 'Natalia', 'Vanessa', 'Tatiana', 'Maribel', 'Johanna'],
      last: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Morales', 'Reyes', 'Cruz', 'Ortiz', 'Gutiérrez', 'Chávez', 'Romero', 'Vargas', 'Mendoza', 'Ruiz', 'Álvarez', 'Castillo', 'Jiménez', 'Moreno', 'Paredes', 'Aguirre', 'Vega', 'Ramos', 'Medina', 'Suárez', 'Herrera']
    }
  },
  BR: { // Бразилия
    male: {
      first: ['João', 'Pedro', 'Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Bruno', 'Gustavo', 'Felipe', 'Leonardo', 'Thiago', 'André', 'Ricardo', 'Rodrigo', 'Eduardo', 'Vinícius', 'Henrique', 'Marcelo', 'Diego', 'Fábio', 'Caio', 'Renato', 'Leandro', 'Marcos', 'Paulo', 'Guilherme', 'Victor', 'Fernando', 'Luciano', 'Sérgio', 'Alex', 'Danilo', 'Rogério', 'Carlos', 'Márcio'],
      last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Araújo', 'Nascimento', 'Barbosa', 'Moreira', 'Melo', 'Cardoso', 'Rocha', 'Nunes', 'Dias', 'Teixeira', 'Mendes', 'Cavalcante', 'Monteiro', 'Moura', 'Correia', 'Batista', 'Freitas', 'Vieira', 'Pinto', 'Campos']
    },
    female: {
      first: ['Ana', 'Maria', 'Juliana', 'Fernanda', 'Patrícia', 'Camila', 'Aline', 'Amanda', 'Bruna', 'Carolina', 'Larissa', 'Letícia', 'Mariana', 'Natália', 'Rafaela', 'Gabriela', 'Beatriz', 'Jéssica', 'Vanessa', 'Priscila', 'Renata', 'Luciana', 'Adriana', 'Cristiane', 'Tatiane', 'Débora', 'Fabiana', 'Andréa', 'Paula', 'Mônica', 'Carla', 'Sandra', 'Rosana', 'Simone', 'Cláudia'],
      last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Araújo', 'Nascimento', 'Barbosa', 'Moreira', 'Melo', 'Cardoso', 'Rocha', 'Nunes', 'Dias', 'Teixeira', 'Mendes', 'Cavalcante', 'Monteiro', 'Moura', 'Correia', 'Batista', 'Freitas', 'Vieira', 'Pinto', 'Campos']
    }
  },
  MX: { // Мексика
    male: {
      first: ['José', 'Juan', 'Miguel', 'Carlos', 'Luis', 'Francisco', 'Antonio', 'Alejandro', 'Ricardo', 'Fernando', 'Javier', 'Eduardo', 'Arturo', 'Roberto', 'Sergio', 'Óscar', 'Raúl', 'Enrique', 'Jorge', 'Gerardo', 'Héctor', 'Rafael', 'Alfredo', 'Martín', 'Jesús', 'Andrés', 'Rubén', 'Víctor', 'Pablo', 'César', 'David', 'Manuel', 'Ramón', 'Ignacio', 'Ernesto'],
      last: ['García', 'Hernández', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Vargas', 'Mendoza', 'Castillo', 'Ortiz', 'Ruiz', 'Moreno', 'Romero', 'Gutiérrez', 'Álvarez', 'Chávez', 'Ramos', 'Vázquez', 'Herrera', 'Aguilar', 'Medina', 'Domínguez', 'Castro', 'Muñoz']
    },
    female: {
      first: ['María', 'Guadalupe', 'Margarita', 'Verónica', 'Leticia', 'Rosa', 'Francisca', 'Patricia', 'Elizabeth', 'Alejandra', 'Adriana', 'Gabriela', 'Claudia', 'Silvia', 'Mónica', 'Laura', 'Ana', 'Lucía', 'Carmen', 'Yolanda', 'Teresa', 'Alicia', 'Sandra', 'Martha', 'Irma', 'Rocío', 'Beatriz', 'Carolina', 'Daniela', 'Fernanda', 'Juana', 'Gloria', 'Lorena', 'Norma', 'Marisol'],
      last: ['García', 'Hernández', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Vargas', 'Mendoza', 'Castillo', 'Ortiz', 'Ruiz', 'Moreno', 'Romero', 'Gutiérrez', 'Álvarez', 'Chávez', 'Ramos', 'Vázquez', 'Herrera', 'Aguilar', 'Medina', 'Domínguez', 'Castro', 'Muñoz']
    }
  },
  CO: { // Колумбия
    male: {
      first: ['Juan', 'Carlos', 'Andrés', 'José', 'David', 'Santiago', 'Sebastián', 'Alejandro', 'Daniel', 'Luis', 'Miguel', 'Camilo', 'Felipe', 'Julián', 'Nicolás', 'Jorge', 'Óscar', 'Fernando', 'Ricardo', 'Mauricio', 'Gustavo', 'Hernán', 'Édgar', 'Fabián', 'Iván', 'Cristian', 'Esteban', 'Jairo', 'Álvaro', 'Germán', 'William', 'Jhon', 'Sergio', 'Edison', 'Héctor'],
      last: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Sánchez', 'Ramírez', 'Torres', 'Díaz', 'Vargas', 'Moreno', 'Rojas', 'Jiménez', 'Castro', 'Gómez', 'Ruiz', 'Ortiz', 'Gutiérrez', 'Pérez', 'Ríos', 'Herrera', 'Medina', 'Parra', 'Reyes', 'Cruz', 'Ramos', 'Valencia', 'Cardona', 'Ospina', 'Correa', 'Álvarez', 'Mejía', 'Giraldo', 'Suárez']
    },
    female: {
      first: ['María', 'Ana', 'Claudia', 'Patricia', 'Sandra', 'Carolina', 'Andrea', 'Diana', 'Mónica', 'Paola', 'Natalia', 'Valentina', 'Laura', 'Daniela', 'Camila', 'Juliana', 'Marcela', 'Lorena', 'Adriana', 'Ángela', 'Milena', 'Viviana', 'Alejandra', 'Esperanza', 'Lina', 'Yolanda', 'Luz', 'Gloria', 'Martha', 'Beatriz', 'Liliana', 'Nancy', 'Isabel', 'Olga', 'Consuelo'],
      last: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Sánchez', 'Ramírez', 'Torres', 'Díaz', 'Vargas', 'Moreno', 'Rojas', 'Jiménez', 'Castro', 'Gómez', 'Ruiz', 'Ortiz', 'Gutiérrez', 'Pérez', 'Ríos', 'Herrera', 'Medina', 'Parra', 'Reyes', 'Cruz', 'Ramos', 'Valencia', 'Cardona', 'Ospina', 'Correa', 'Álvarez', 'Mejía', 'Giraldo', 'Suárez']
    }
  },
  AR: { // Аргентина
    male: {
      first: ['Juan', 'Carlos', 'José', 'Luis', 'Miguel', 'Martín', 'Pablo', 'Diego', 'Alejandro', 'Fernando', 'Nicolás', 'Sebastián', 'Matías', 'Lucas', 'Tomás', 'Facundo', 'Gonzalo', 'Maximiliano', 'Agustín', 'Franco', 'Lautaro', 'Ezequiel', 'Leandro', 'Mariano', 'Damián', 'Federico', 'Ramiro', 'Gastón', 'Nahuel', 'Emiliano', 'Hernán', 'Marcos', 'Ariel', 'Ignacio', 'Rodrigo'],
      last: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Sosa', 'Torres', 'Álvarez', 'Ruiz', 'Benítez', 'Acosta', 'Medina', 'Herrera', 'Suárez', 'Aguirre', 'Pereyra', 'Gutiérrez', 'Giménez', 'Molina', 'Silva', 'Castro', 'Rojas', 'Ortiz', 'Núñez', 'Luna', 'Cabrera', 'Ríos', 'Flores', 'Ramírez']
    },
    female: {
      first: ['María', 'Ana', 'Lucía', 'Florencia', 'Agustina', 'Sofía', 'Valentina', 'Camila', 'Martina', 'Julieta', 'Paula', 'Carolina', 'Victoria', 'Daniela', 'Micaela', 'Romina', 'Belén', 'Milagros', 'Rocío', 'Candela', 'Abril', 'Pilar', 'Guadalupe', 'Celeste', 'Aldana', 'Brenda', 'Melina', 'Carla', 'Macarena', 'Soledad', 'Antonella', 'Natalia', 'Lorena', 'Marina', 'Gisela'],
      last: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Sosa', 'Torres', 'Álvarez', 'Ruiz', 'Benítez', 'Acosta', 'Medina', 'Herrera', 'Suárez', 'Aguirre', 'Pereyra', 'Gutiérrez', 'Giménez', 'Molina', 'Silva', 'Castro', 'Rojas', 'Ortiz', 'Núñez', 'Luna', 'Cabrera', 'Ríos', 'Flores', 'Ramírez']
    }
  },
  CL: { // Чили
    male: {
      first: ['José', 'Juan', 'Luis', 'Carlos', 'Francisco', 'Sebastián', 'Matías', 'Nicolás', 'Benjamín', 'Vicente', 'Martín', 'Diego', 'Felipe', 'Tomás', 'Agustín', 'Cristóbal', 'Ignacio', 'Joaquín', 'Lucas', 'Gabriel', 'Maximiliano', 'Pablo', 'Rodrigo', 'Fernando', 'Andrés', 'Gonzalo', 'Alejandro', 'Daniel', 'Claudio', 'Mauricio', 'Ricardo', 'Eduardo', 'Patricio', 'Jorge', 'Héctor'],
      last: ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'García', 'Araya', 'Reyes', 'Torres', 'Castillo', 'Espinoza', 'Gutiérrez', 'Valenzuela', 'Figueroa', 'Jara', 'Ramírez', 'Vera', 'Vega', 'Carrasco', 'Sandoval', 'Tapia', 'Núñez', 'Bravo', 'Pizarro', 'Cortés']
    },
    female: {
      first: ['María', 'Sofía', 'Martina', 'Florencia', 'Valentina', 'Isidora', 'Agustina', 'Catalina', 'Fernanda', 'Javiera', 'Antonella', 'Emilia', 'Francisca', 'Amanda', 'Constanza', 'Camila', 'Daniela', 'Carolina', 'Natalia', 'Paola', 'Claudia', 'Andrea', 'Alejandra', 'Macarena', 'Bárbara', 'Nicole', 'Paulina', 'Katherine', 'Gabriela', 'Lorena', 'Patricia', 'Marcela', 'Verónica', 'Ximena', 'Paula'],
      last: ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'García', 'Araya', 'Reyes', 'Torres', 'Castillo', 'Espinoza', 'Gutiérrez', 'Valenzuela', 'Figueroa', 'Jara', 'Ramírez', 'Vera', 'Vega', 'Carrasco', 'Sandoval', 'Tapia', 'Núñez', 'Bravo', 'Pizarro', 'Cortés']
    }
  },
  PE: { // Перу
    male: {
      first: ['José', 'Juan', 'Luis', 'Carlos', 'Jorge', 'Miguel', 'César', 'Pedro', 'Manuel', 'Ricardo', 'Ángel', 'Fernando', 'Eduardo', 'Víctor', 'Daniel', 'Julio', 'Alberto', 'Alfredo', 'Raúl', 'Oscar', 'Sergio', 'Enrique', 'Javier', 'Pablo', 'Francisco', 'Rubén', 'Marco', 'Christian', 'Walter', 'Arturo', 'Gustavo', 'Héctor', 'Jesús', 'Alex', 'Diego'],
      last: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Chávez', 'Díaz', 'Morales', 'Vásquez', 'Castillo', 'Quispe', 'Vargas', 'Rojas', 'Cruz', 'Mendoza', 'Gutiérrez', 'Ortiz', 'Herrera', 'Ruiz', 'Silva', 'Medina', 'Pérez', 'Espinoza', 'Ríos', 'Paredes', 'Huamán', 'Delgado', 'Castro', 'Fernández', 'Reyes']
    },
    female: {
      first: ['María', 'Rosa', 'Ana', 'Carmen', 'Luz', 'Milagros', 'Patricia', 'Elizabeth', 'Flor', 'Julia', 'Lucía', 'Claudia', 'Gabriela', 'Karina', 'Mónica', 'Liliana', 'Yolanda', 'Gloria', 'Teresa', 'Silvia', 'Verónica', 'Diana', 'Carla', 'Rocío', 'Sandra', 'Paola', 'Vanessa', 'Jessica', 'Katherine', 'Andrea', 'Fiorella', 'Nataly', 'Melissa', 'Gisela', 'Mariela'],
      last: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Chávez', 'Díaz', 'Morales', 'Vásquez', 'Castillo', 'Quispe', 'Vargas', 'Rojas', 'Cruz', 'Mendoza', 'Gutiérrez', 'Ortiz', 'Herrera', 'Ruiz', 'Silva', 'Medina', 'Pérez', 'Espinoza', 'Ríos', 'Paredes', 'Huamán', 'Delgado', 'Castro', 'Fernández', 'Reyes']
    }
  },
  ES: { // Испания
    male: {
      first: ['Antonio', 'Manuel', 'José', 'Francisco', 'David', 'Juan', 'Javier', 'Daniel', 'Carlos', 'Jesús', 'Alejandro', 'Miguel', 'Rafael', 'Pablo', 'Sergio', 'Ángel', 'Fernando', 'Luis', 'Jorge', 'Alberto', 'Álvaro', 'Diego', 'Adrián', 'Raúl', 'Enrique', 'Ramón', 'Vicente', 'Iván', 'Rubén', 'Óscar', 'Andrés', 'Joaquín', 'Eduardo', 'Pedro', 'Marcos', 'Hugo', 'Mario', 'Guillermo', 'Salvador', 'Roberto'],
      last: ['García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Molina', 'Morales', 'Suárez', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias']
    },
    female: {
      first: ['María', 'Carmen', 'Ana', 'Isabel', 'Dolores', 'Pilar', 'Teresa', 'Rosa', 'Cristina', 'Marta', 'Laura', 'Lucía', 'Elena', 'Sofía', 'Paula', 'Mercedes', 'Josefa', 'Francisca', 'Antonia', 'Raquel', 'Beatriz', 'Patricia', 'Sara', 'Nuria', 'Alba', 'Silvia', 'Andrea', 'Rocío', 'Alicia', 'Irene', 'Claudia', 'Natalia', 'Susana', 'Eva', 'Marina', 'Inés', 'Julia', 'Victoria', 'Lorena', 'Sandra'],
      last: ['García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Molina', 'Morales', 'Suárez', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias']
    }
  },
  IT: { // Италия
    male: {
      first: ['Marco', 'Giuseppe', 'Giovanni', 'Antonio', 'Francesco', 'Mario', 'Luigi', 'Andrea', 'Paolo', 'Stefano', 'Luca', 'Alessandro', 'Matteo', 'Davide', 'Simone', 'Roberto', 'Riccardo', 'Fabio', 'Alberto', 'Claudio', 'Massimo', 'Gianluca', 'Daniele', 'Federico', 'Lorenzo', 'Nicola', 'Michele', 'Vincenzo', 'Salvatore', 'Giorgio', 'Filippo', 'Emanuele', 'Leonardo', 'Gabriele', 'Tommaso'],
      last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Mazza', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile', 'Martinelli', 'Vitale']
    },
    female: {
      first: ['Maria', 'Anna', 'Giulia', 'Francesca', 'Chiara', 'Sara', 'Valentina', 'Alessia', 'Martina', 'Federica', 'Elisa', 'Silvia', 'Paola', 'Laura', 'Giorgia', 'Roberta', 'Monica', 'Elena', 'Simona', 'Claudia', 'Barbara', 'Daniela', 'Cristina', 'Serena', 'Ilaria', 'Marta', 'Lucia', 'Alessandra', 'Angela', 'Sofia', 'Aurora', 'Beatrice', 'Alice', 'Gaia', 'Emma'],
      last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Mazza', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile', 'Martinelli', 'Vitale']
    }
  },
  FR: { // Франция
    male: {
      first: ['Jean', 'Pierre', 'Michel', 'André', 'Philippe', 'Jacques', 'Bernard', 'François', 'Louis', 'Nicolas', 'Thomas', 'Julien', 'Antoine', 'Mathieu', 'Alexandre', 'Sébastien', 'Christophe', 'David', 'Laurent', 'Frédéric', 'Patrick', 'Olivier', 'Stéphane', 'Vincent', 'Éric', 'Bruno', 'Alain', 'Thierry', 'Emmanuel', 'Maxime', 'Lucas', 'Hugo', 'Théo', 'Gabriel', 'Raphaël'],
      last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefèvre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand', 'Garnier', 'Faure', 'Rousseau', 'Blanc']
    },
    female: {
      first: ['Marie', 'Jeanne', 'Françoise', 'Monique', 'Catherine', 'Nathalie', 'Isabelle', 'Sylvie', 'Anne', 'Sophie', 'Julie', 'Camille', 'Claire', 'Émilie', 'Charlotte', 'Sandrine', 'Stéphanie', 'Céline', 'Valérie', 'Caroline', 'Virginie', 'Aurélie', 'Delphine', 'Laure', 'Manon', 'Léa', 'Emma', 'Chloé', 'Jade', 'Louise', 'Sarah', 'Mathilde', 'Margot', 'Juliette', 'Alice'],
      last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefèvre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand', 'Garnier', 'Faure', 'Rousseau', 'Blanc']
    }
  },
  DE: { // Германия
    male: {
      first: ['Peter', 'Michael', 'Wolfgang', 'Thomas', 'Klaus', 'Hans', 'Werner', 'Jürgen', 'Heinz', 'Dieter', 'Stefan', 'Andreas', 'Christian', 'Martin', 'Markus', 'Frank', 'Uwe', 'Bernd', 'Ralf', 'Matthias', 'Jörg', 'Holger', 'Sven', 'Torsten', 'Karsten', 'Dirk', 'Olaf', 'Florian', 'Daniel', 'Tobias', 'Sebastian', 'Philipp', 'Maximilian', 'Alexander', 'Jan', 'Tim', 'Felix', 'Lukas', 'Jonas', 'Leon'],
      last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier', 'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'König', 'Walter', 'Mayer', 'Huber']
    },
    female: {
      first: ['Ursula', 'Renate', 'Monika', 'Petra', 'Sabine', 'Andrea', 'Anna', 'Maria', 'Julia', 'Sandra', 'Claudia', 'Nicole', 'Stefanie', 'Christina', 'Laura', 'Karin', 'Brigitte', 'Helga', 'Ingrid', 'Heike', 'Birgit', 'Susanne', 'Martina', 'Gabriele', 'Katrin', 'Anja', 'Melanie', 'Katharina', 'Sophie', 'Lisa', 'Emma', 'Lena', 'Sarah', 'Hannah', 'Lea', 'Marie', 'Johanna', 'Jana', 'Franziska', 'Vanessa'],
      last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier', 'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'König', 'Walter', 'Mayer', 'Huber']
    }
  },
  PL: { // Польша
    male: {
      first: ['Jan', 'Andrzej', 'Piotr', 'Krzysztof', 'Stanisław', 'Tomasz', 'Paweł', 'Marcin', 'Michał', 'Marek', 'Grzegorz', 'Józef', 'Adam', 'Łukasz', 'Rafał', 'Jacek', 'Wojciech', 'Zbigniew', 'Jerzy', 'Ryszard', 'Dariusz', 'Henryk', 'Mariusz', 'Tadeusz', 'Kazimierz', 'Maciej', 'Kamil', 'Dawid', 'Jakub', 'Mateusz', 'Filip', 'Kacper', 'Szymon', 'Bartosz', 'Dominik'],
      last: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Wojciechowski', 'Kwiatkowski', 'Krawczyk', 'Kaczmarek', 'Piotrowski', 'Grabowski', 'Pawłowski', 'Michalski', 'Nowakowski', 'Adamczyk', 'Dudek', 'Zając', 'Wieczorek', 'Jabłoński', 'Król', 'Majewski', 'Olszewski', 'Jaworski', 'Wróbel', 'Malinowski', 'Stępień']
    },
    female: {
      first: ['Anna', 'Maria', 'Katarzyna', 'Małgorzata', 'Agnieszka', 'Barbara', 'Ewa', 'Krystyna', 'Elżbieta', 'Magdalena', 'Joanna', 'Monika', 'Dorota', 'Aleksandra', 'Natalia', 'Karolina', 'Justyna', 'Beata', 'Zofia', 'Renata', 'Paulina', 'Sylwia', 'Iwona', 'Bożena', 'Marta', 'Patrycja', 'Weronika', 'Julia', 'Zuzanna', 'Maja', 'Lena', 'Hanna', 'Alicja', 'Oliwia', 'Amelia'],
      last: ['Nowak', 'Kowalska', 'Wiśniewska', 'Wójcik', 'Kowalczyk', 'Kamińska', 'Lewandowska', 'Zielińska', 'Szymańska', 'Woźniak', 'Dąbrowska', 'Kozłowska', 'Jankowska', 'Mazur', 'Wojciechowska', 'Kwiatkowska', 'Krawczyk', 'Kaczmarek', 'Piotrowska', 'Grabowska', 'Pawłowska', 'Michalska', 'Nowakowska', 'Adamczyk', 'Dudek', 'Zając', 'Wieczorek', 'Jabłońska', 'Król', 'Majewska', 'Olszewska', 'Jaworska', 'Wróbel', 'Malinowska', 'Stępień']
    }
  },
  US: { // США
    male: {
      first: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Raymond'],
      last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Adams', 'Nelson', 'Baker']
    },
    female: {
      first: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Emily', 'Sandra', 'Ashley', 'Kimberly', 'Michelle', 'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen', 'Samantha'],
      last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Adams', 'Nelson', 'Baker']
    }
  },
  RU: { // Россия
    male: {
      first: ['Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 'Илья', 'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Егор', 'Иван', 'Владимир', 'Денис', 'Евгений', 'Павел', 'Николай', 'Владислав', 'Олег', 'Виктор', 'Константин', 'Антон', 'Игорь', 'Юрий', 'Вячеслав', 'Василий', 'Григорий', 'Тимофей', 'Даниил', 'Марк', 'Глеб', 'Степан', 'Фёдор', 'Георгий', 'Леонид', 'Борис', 'Пётр'],
      last: ['Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Фёдоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семёнов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев', 'Орлов', 'Андреев', 'Макаров', 'Никитин', 'Захаров', 'Зайцев', 'Соловьёв', 'Борисов', 'Яковлев', 'Григорьев', 'Романов', 'Воробьёв', 'Сергеев', 'Кузьмин', 'Фролов', 'Александров', 'Дмитриев', 'Королёв', 'Гусев', 'Киселёв']
    },
    female: {
      first: ['Анна', 'Мария', 'Елена', 'Дарья', 'Алиса', 'Полина', 'Анастасия', 'Виктория', 'Екатерина', 'Софья', 'Варвара', 'Ксения', 'Александра', 'Вероника', 'Арина', 'Ольга', 'Наталья', 'Татьяна', 'Ирина', 'Светлана', 'Юлия', 'Марина', 'Валентина', 'Галина', 'Людмила', 'Надежда', 'Любовь', 'Евгения', 'Оксана', 'Кристина', 'Милана', 'Диана', 'Алина', 'Ева', 'Маргарита', 'Валерия', 'Яна', 'Карина', 'Василиса', 'Ульяна'],
      last: ['Иванова', 'Смирнова', 'Кузнецова', 'Попова', 'Васильева', 'Петрова', 'Соколова', 'Михайлова', 'Новикова', 'Фёдорова', 'Морозова', 'Волкова', 'Алексеева', 'Лебедева', 'Семёнова', 'Егорова', 'Павлова', 'Козлова', 'Степанова', 'Николаева', 'Орлова', 'Андреева', 'Макарова', 'Никитина', 'Захарова', 'Зайцева', 'Соловьёва', 'Борисова', 'Яковлева', 'Григорьева', 'Романова', 'Воробьёва', 'Сергеева', 'Кузьмина', 'Фролова', 'Александрова', 'Дмитриева', 'Королёва', 'Гусева', 'Киселёва']
    }
  },
  KZ: { // Казахстан
    male: {
      first: ['Алихан', 'Нурсултан', 'Арман', 'Ернар', 'Бауыржан', 'Дархан', 'Жанибек', 'Нурлан', 'Серик', 'Тимур', 'Асхат', 'Данияр', 'Ерлан', 'Канат', 'Мурат', 'Азамат', 'Берик', 'Болат', 'Галым', 'Дастан', 'Ержан', 'Жандос', 'Кайрат', 'Куаныш', 'Марат', 'Нуржан', 'Олжас', 'Рустем', 'Самат', 'Талгат', 'Уланбек', 'Бахытжан', 'Досым', 'Ескендир', 'Жанболат'],
      last: ['Касымов', 'Нурсултанов', 'Сейтов', 'Омаров', 'Ахметов', 'Байтурсынов', 'Султанов', 'Токаев', 'Жумабаев', 'Бекетов', 'Ибрагимов', 'Мухамедов', 'Сатыбалдиев', 'Жаксылыков', 'Ермеков', 'Абдуллаев', 'Алиев', 'Бектуров', 'Джумабаев', 'Есенов', 'Жангиров', 'Исмаилов', 'Кенжебаев', 'Мусаев', 'Нурпеисов', 'Оразбаев', 'Рахимов', 'Сагындыков', 'Темирбаев', 'Утегенов']
    },
    female: {
      first: ['Айгерим', 'Динара', 'Жанар', 'Алия', 'Гульнар', 'Жанна', 'Карина', 'Мадина', 'Сауле', 'Айнур', 'Асель', 'Дана', 'Камила', 'Нургуль', 'Салтанат', 'Айжан', 'Акмарал', 'Алтынай', 'Анара', 'Арайлым', 'Аружан', 'Балжан', 'Бибигуль', 'Ботагоз', 'Гульзира', 'Дария', 'Жазира', 'Жулдыз', 'Зарина', 'Индира', 'Кымбат', 'Лаура', 'Меруерт', 'Назгуль', 'Сабина'],
      last: ['Касымова', 'Нурсултанова', 'Сейтова', 'Омарова', 'Ахметова', 'Байтурсынова', 'Султанова', 'Токаева', 'Жумабаева', 'Бекетова', 'Ибрагимова', 'Мухамедова', 'Сатыбалдиева', 'Жаксылыкова', 'Ермекова', 'Абдуллаева', 'Алиева', 'Бектурова', 'Джумабаева', 'Есенова', 'Жангирова', 'Исмаилова', 'Кенжебаева', 'Мусаева', 'Нурпеисова', 'Оразбаева', 'Рахимова', 'Сагындыкова', 'Темирбаева', 'Утегенова']
    }
  },
  IN: { // Индия
    male: {
      first: ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharva', 'Advait', 'Aryan', 'Kabir', 'Rohan', 'Raj', 'Amit', 'Rahul', 'Vikram', 'Suresh', 'Manoj', 'Arun', 'Deepak', 'Nikhil', 'Sanjay', 'Vijay', 'Rakesh', 'Ashish', 'Kiran', 'Pranav', 'Dhruv', 'Harsh', 'Akash', 'Ankit'],
      last: ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Shah', 'Joshi', 'Das', 'Reddy', 'Rao', 'Nair', 'Pillai', 'Menon', 'Iyer', 'Chopra', 'Kapoor', 'Malhotra', 'Mehta', 'Agarwal', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Bose', 'Sen', 'Ghosh', 'Dutta', 'Roy', 'Mishra', 'Tiwari', 'Pandey', 'Dubey', 'Saxena', 'Kulkarni', 'Deshmukh']
    },
    female: {
      first: ['Aadhya', 'Ananya', 'Diya', 'Isha', 'Kavya', 'Myra', 'Navya', 'Pari', 'Riya', 'Saanvi', 'Sara', 'Shreya', 'Tanya', 'Trisha', 'Zara', 'Priya', 'Anjali', 'Neha', 'Pooja', 'Sunita', 'Meena', 'Rekha', 'Lakshmi', 'Radha', 'Sita', 'Geeta', 'Aisha', 'Kiara', 'Anika', 'Ishita', 'Kritika', 'Divya', 'Swati', 'Nisha', 'Komal'],
      last: ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Shah', 'Joshi', 'Das', 'Reddy', 'Rao', 'Nair', 'Pillai', 'Menon', 'Iyer', 'Chopra', 'Kapoor', 'Malhotra', 'Mehta', 'Agarwal', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Bose', 'Sen', 'Ghosh', 'Dutta', 'Roy', 'Mishra', 'Tiwari', 'Pandey', 'Dubey', 'Saxena', 'Kulkarni', 'Deshmukh']
    }
  },
  TH: { // Таиланд
    male: {
      first: ['Somchai', 'Somsak', 'Sompong', 'Prasert', 'Preecha', 'Prawit', 'Thanakorn', 'Thawatchai', 'Wichai', 'Wichit', 'Arthit', 'Anon', 'Nattapong', 'Kittisak', 'Pongsakorn', 'Chatchai', 'Surachai', 'Boonchu', 'Kritsada', 'Worawut', 'Apichart', 'Chanon', 'Danai', 'Ekachai', 'Kamon', 'Noppadon', 'Panupong', 'Sirichai', 'Theerawat', 'Weerachai', 'Narongrit', 'Suraphong', 'Chaiyasit', 'Pichit', 'Teerasak'],
      last: ['Saetang', 'Srisawat', 'Phongphan', 'Wongsawat', 'Chaiyaporn', 'Suksawat', 'Thongchai', 'Siriwan', 'Prasit', 'Rattana', 'Phromma', 'Saengthong', 'Bunyasarn', 'Jitprasert', 'Sawatdee', 'Wongsa', 'Phanomchai', 'Intharaprasit', 'Jaroensuk', 'Kulthorn', 'Lertpanya', 'Nakphrom', 'Pattanasri', 'Rungruang', 'Somboon', 'Thanaporn', 'Udomphol', 'Wattanaphon', 'Yodsawat', 'Chanthorn', 'Duangporn', 'Kaewkla', 'Mahasuk', 'Pitakpong', 'Ratchada']
    },
    female: {
      first: ['Somying', 'Suwanna', 'Pranee', 'Pensri', 'Rattana', 'Wilai', 'Nittaya', 'Orawan', 'Supaporn', 'Thitima', 'Apinya', 'Kulthida', 'Nanthana', 'Patcharee', 'Siriporn', 'Chanida', 'Duangjai', 'Jiraporn', 'Kanokwan', 'Ladda', 'Malee', 'Naruemon', 'Patchara', 'Rungnapa', 'Sasiprapa', 'Thidarat', 'Urai', 'Wanida', 'Yuphin', 'Araya', 'Benja', 'Chalita', 'Dawan', 'Fongchan', 'Kanya'],
      last: ['Saetang', 'Srisawat', 'Phongphan', 'Wongsawat', 'Chaiyaporn', 'Suksawat', 'Thongchai', 'Siriwan', 'Prasit', 'Rattana', 'Phromma', 'Saengthong', 'Bunyasarn', 'Jitprasert', 'Sawatdee', 'Wongsa', 'Phanomchai', 'Intharaprasit', 'Jaroensuk', 'Kulthorn', 'Lertpanya', 'Nakphrom', 'Pattanasri', 'Rungruang', 'Somboon', 'Thanaporn', 'Udomphol', 'Wattanaphon', 'Yodsawat', 'Chanthorn', 'Duangporn', 'Kaewkla', 'Mahasuk', 'Pitakpong', 'Ratchada']
    }
  },
  ID: { // Индонезия
    male: {
      first: ['Adi', 'Agus', 'Budi', 'Dedi', 'Eko', 'Fajar', 'Hadi', 'Irwan', 'Joko', 'Kurniawan', 'Muhammad', 'Nur', 'Putra', 'Rudi', 'Sigit', 'Ahmad', 'Bambang', 'Cahyo', 'Dimas', 'Fauzi', 'Guntur', 'Hendra', 'Ivan', 'Johan', 'Kemal', 'Leo', 'Maulana', 'Nanda', 'Omar', 'Prima', 'Raka', 'Satria', 'Teguh', 'Umar', 'Wahyu'],
      last: ['Wijaya', 'Susanto', 'Santoso', 'Pranoto', 'Kusuma', 'Hidayat', 'Gunawan', 'Wibowo', 'Hartono', 'Saputra', 'Nugroho', 'Suryadi', 'Pratama', 'Hakim', 'Setiawan', 'Firmansyah', 'Budiman', 'Kurniawan', 'Permana', 'Ramadhan', 'Siregar', 'Nasution', 'Harahap', 'Lubis', 'Siahaan', 'Simanjuntak', 'Panjaitan', 'Hutapea', 'Sitorus', 'Purba', 'Sinaga', 'Situmorang', 'Nainggolan', 'Simbolon', 'Sirait']
    },
    female: {
      first: ['Ani', 'Dewi', 'Fitri', 'Indah', 'Kartini', 'Lestari', 'Maya', 'Nia', 'Putri', 'Ratna', 'Sari', 'Sri', 'Tuti', 'Wati', 'Yuni', 'Ayu', 'Bella', 'Citra', 'Dian', 'Eka', 'Febri', 'Gita', 'Hana', 'Intan', 'Jasmine', 'Kartika', 'Laras', 'Mega', 'Nadia', 'Oktavia', 'Puspita', 'Rina', 'Sinta', 'Tari', 'Utami'],
      last: ['Wijaya', 'Susanto', 'Santoso', 'Pranoto', 'Kusuma', 'Hidayat', 'Gunawan', 'Wibowo', 'Hartono', 'Saputra', 'Nugroho', 'Suryadi', 'Pratama', 'Hakim', 'Setiawan', 'Firmansyah', 'Budiman', 'Kurniawan', 'Permana', 'Ramadhan', 'Siregar', 'Nasution', 'Harahap', 'Lubis', 'Siahaan', 'Simanjuntak', 'Panjaitan', 'Hutapea', 'Sitorus', 'Purba', 'Sinaga', 'Situmorang', 'Nainggolan', 'Simbolon', 'Sirait']
    }
  },
  PH: { // Филиппины
    male: {
      first: ['Jose', 'Juan', 'Antonio', 'Francisco', 'Manuel', 'Ricardo', 'Eduardo', 'Fernando', 'Roberto', 'Carlos', 'Miguel', 'Rafael', 'Gabriel', 'Danilo', 'Reynaldo', 'Mark', 'John', 'Michael', 'James', 'Patrick', 'Christian', 'Angelo', 'Kevin', 'Bryan', 'Jason', 'Ryan', 'Jerome', 'Dennis', 'Allan', 'Ariel', 'Jayson', 'Ronnie', 'Ricky', 'Leo', 'Vincent'],
      last: ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andrade', 'Castillo', 'Fernandez', 'Lopez', 'Gonzales', 'Ramos', 'Rivera', 'Diaz', 'Martinez', 'Perez', 'Villanueva', 'Dela Cruz', 'De Leon', 'Navarro', 'Mercado', 'Aquino', 'Salvador', 'Aguilar', 'Velasco', 'Pascual', 'Soriano', 'Valdez', 'Salazar', 'Delos Santos', 'Manalo', 'Corpuz']
    },
    female: {
      first: ['Maria', 'Ana', 'Rosa', 'Lourdes', 'Carmen', 'Teresa', 'Patricia', 'Elizabeth', 'Michelle', 'Jennifer', 'Angelica', 'Cristina', 'Katherine', 'Joanna', 'Grace', 'Mary', 'Jessica', 'Karen', 'Nicole', 'Jasmine', 'Angel', 'Princess', 'Lovely', 'Joy', 'Faith', 'Hope', 'Precious', 'Divine', 'Cherry', 'April', 'Mae', 'Rose', 'Anne', 'Jane', 'Joyce'],
      last: ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andrade', 'Castillo', 'Fernandez', 'Lopez', 'Gonzales', 'Ramos', 'Rivera', 'Diaz', 'Martinez', 'Perez', 'Villanueva', 'Dela Cruz', 'De Leon', 'Navarro', 'Mercado', 'Aquino', 'Salvador', 'Aguilar', 'Velasco', 'Pascual', 'Soriano', 'Valdez', 'Salazar', 'Delos Santos', 'Manalo', 'Corpuz']
    }
  },
  VN: { // Вьетнам
    male: {
      first: ['Minh', 'Duc', 'Hung', 'Tuan', 'Long', 'Hieu', 'Dung', 'Thanh', 'Quang', 'Trung', 'Nam', 'Hoang', 'Khanh', 'Phong', 'Bao', 'Cuong', 'Dat', 'Hai', 'Huy', 'Khoa', 'Lam', 'Loc', 'Manh', 'Nghia', 'Phat', 'Son', 'Tai', 'Tan', 'Thang', 'Thinh', 'Tien', 'Tri', 'Vinh', 'Vu', 'An'],
      last: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly', 'Truong', 'Dinh', 'Ha', 'Luu', 'Mai', 'Trinh', 'Cao', 'Lam', 'Luong', 'Ta', 'Dao', 'Doan', 'Diep', 'Tran', 'Bach', 'Chau', 'Kieu', 'Thai', 'Quach']
    },
    female: {
      first: ['Linh', 'Huong', 'Mai', 'Lan', 'Ngoc', 'Hoa', 'Thu', 'Hong', 'Thao', 'Hanh', 'Phuong', 'Anh', 'Trang', 'Yen', 'Nhung', 'Bich', 'Chi', 'Diem', 'Ha', 'Hang', 'Khanh', 'Kim', 'Lien', 'Loan', 'My', 'Ngan', 'Nhi', 'Oanh', 'Quyen', 'Suong', 'Tam', 'Thanh', 'Thuy', 'Tram', 'Van'],
      last: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly', 'Truong', 'Dinh', 'Ha', 'Luu', 'Mai', 'Trinh', 'Cao', 'Lam', 'Luong', 'Ta', 'Dao', 'Doan', 'Diep', 'Tran', 'Bach', 'Chau', 'Kieu', 'Thai', 'Quach']
    }
  },
  // Дополнительные языковые группы
  AR_ARAB: { // Арабские страны
    male: {
      first: ['Mohammed', 'Ahmed', 'Ali', 'Omar', 'Youssef', 'Ibrahim', 'Khalid', 'Hassan', 'Mahmoud', 'Mustafa', 'Abdallah', 'Tariq', 'Faisal', 'Samir', 'Karim', 'Nasser', 'Rashid', 'Walid', 'Jamal', 'Hani', 'Ziad', 'Rami', 'Sami', 'Adel', 'Bilal', 'Hamza', 'Younis', 'Majid', 'Saleh', 'Fahad'],
      last: ['Al-Ahmad', 'Al-Hassan', 'Al-Mohammed', 'Al-Ali', 'Al-Omar', 'Al-Ibrahim', 'Al-Khalid', 'Al-Rashid', 'Al-Sultan', 'Al-Nasser', 'Al-Farsi', 'Al-Qasim', 'Al-Mansour', 'Al-Zahrani', 'Al-Ghamdi', 'Al-Harbi', 'Al-Shammari', 'Al-Dosari', 'Al-Otaibi', 'Al-Mutairi', 'Al-Qahtani', 'Al-Malki', 'Al-Juhani', 'Al-Suwaidi', 'Al-Maktoum']
    },
    female: {
      first: ['Fatima', 'Aisha', 'Maryam', 'Nour', 'Sara', 'Layla', 'Hana', 'Yasmin', 'Amira', 'Dina', 'Rania', 'Lina', 'Jana', 'Salma', 'Noura', 'Mariam', 'Zainab', 'Aya', 'Malak', 'Reem', 'Dana', 'Farah', 'Huda', 'Mona', 'Samira', 'Lamia', 'Nadia', 'Rasha', 'Sawsan', 'Wafa'],
      last: ['Al-Ahmad', 'Al-Hassan', 'Al-Mohammed', 'Al-Ali', 'Al-Omar', 'Al-Ibrahim', 'Al-Khalid', 'Al-Rashid', 'Al-Sultan', 'Al-Nasser', 'Al-Farsi', 'Al-Qasim', 'Al-Mansour', 'Al-Zahrani', 'Al-Ghamdi', 'Al-Harbi', 'Al-Shammari', 'Al-Dosari', 'Al-Otaibi', 'Al-Mutairi', 'Al-Qahtani', 'Al-Malki', 'Al-Juhani', 'Al-Suwaidi', 'Al-Maktoum']
    }
  },
  TR: { // Турция
    male: {
      first: ['Mehmet', 'Mustafa', 'Ahmet', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'İsmail', 'Osman', 'Yusuf', 'Murat', 'Ömer', 'Fatih', 'Emre', 'Burak', 'Cem', 'Kaan', 'Serkan', 'Onur', 'Tolga', 'Berk', 'Arda', 'Deniz', 'Kerem', 'Efe', 'Can', 'Eren', 'Yiğit', 'Barış', 'Umut'],
      last: ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Karaca', 'Tekin', 'Güneş', 'Aksoy', 'Erdoğan', 'Ünal', 'Aktaş', 'Bal']
    },
    female: {
      first: ['Fatma', 'Ayşe', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Merve', 'Büşra', 'Esra', 'Nur', 'Seda', 'Gamze', 'Özge', 'Derya', 'Aslı', 'Gül', 'Hülya', 'Sibel', 'Sevgi', 'Dilek', 'Pınar', 'Ceren', 'Tuğba', 'İrem', 'Ebru', 'Gizem', 'Şeyma', 'Ece', 'Melis', 'Dilan'],
      last: ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Karaca', 'Tekin', 'Güneş', 'Aksoy', 'Erdoğan', 'Ünal', 'Aktaş', 'Bal']
    }
  },
  CN: { // Китай
    male: {
      first: ['Wei', 'Fang', 'Lei', 'Jun', 'Tao', 'Ming', 'Chao', 'Jian', 'Hao', 'Yang', 'Long', 'Feng', 'Bo', 'Chen', 'Xiang', 'Peng', 'Dong', 'Bin', 'Gang', 'Hui', 'Jie', 'Kai', 'Liang', 'Nan', 'Ping', 'Qiang', 'Rui', 'Sheng', 'Ting', 'Wen'],
      last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Lin', 'Luo', 'Gao', 'Zheng', 'Liang', 'Xie', 'Tang', 'Han', 'Cao', 'Feng', 'Deng', 'Xiao', 'Cheng']
    },
    female: {
      first: ['Fang', 'Jing', 'Li', 'Mei', 'Na', 'Ping', 'Qing', 'Rong', 'Shan', 'Ting', 'Wei', 'Xia', 'Yan', 'Ying', 'Yu', 'Yue', 'Zhen', 'Hui', 'Juan', 'Lan', 'Lei', 'Lin', 'Min', 'Ning', 'Qian', 'Xin', 'Hong', 'Jie', 'Ling', 'Xue'],
      last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Lin', 'Luo', 'Gao', 'Zheng', 'Liang', 'Xie', 'Tang', 'Han', 'Cao', 'Feng', 'Deng', 'Xiao', 'Cheng']
    }
  },
  JP: { // Япония
    male: {
      first: ['Hiroshi', 'Takeshi', 'Kenji', 'Taro', 'Yuki', 'Kazuki', 'Daiki', 'Shota', 'Ren', 'Haruto', 'Yuto', 'Sota', 'Kaito', 'Riku', 'Kento', 'Hayato', 'Ryota', 'Takumi', 'Yuma', 'Shun', 'Naoki', 'Akira', 'Makoto', 'Kouki', 'Ryusei', 'Taiga', 'Yamato', 'Koki', 'Ryo', 'Sho'],
      last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki', 'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Yamashita', 'Ishikawa', 'Nakajima', 'Maeda', 'Fujita', 'Ogawa']
    },
    female: {
      first: ['Yuko', 'Keiko', 'Sachiko', 'Yuki', 'Hana', 'Sakura', 'Aoi', 'Yui', 'Rin', 'Mio', 'Mei', 'Himari', 'Koharu', 'Akari', 'Riko', 'Mana', 'Saki', 'Nanami', 'Yuna', 'Honoka', 'Ayaka', 'Misaki', 'Haruka', 'Kana', 'Nana', 'Rika', 'Momoka', 'Shiori', 'Miyu', 'Hinata'],
      last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki', 'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Yamashita', 'Ishikawa', 'Nakajima', 'Maeda', 'Fujita', 'Ogawa']
    }
  },
  KR: { // Южная Корея
    male: {
      first: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ye-jun', 'Si-woo', 'Ha-jun', 'Jun-seo', 'Jun-woo', 'Hyun-woo', 'Ji-hoon', 'Sung-min', 'Jae-min', 'Young-ho', 'Dong-hyun', 'Min-ho', 'Sung-ho', 'Jun-ho', 'Hyun-jin', 'Tae-min', 'Woo-jin', 'Jin-woo', 'Seung-hyun', 'Joon-hyuk', 'Sang-woo', 'Ki-tae', 'Dae-hyun', 'Chang-min', 'Seong-jin', 'Ji-sung', 'Yong-jun'],
      last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong', 'Moon', 'Yang', 'Ko', 'Bae', 'Baek', 'Heo', 'Nam', 'Shim', 'Noh', 'Ha']
    },
    female: {
      first: ['Seo-yeon', 'Ha-yoon', 'Ji-woo', 'Seo-yoon', 'Min-seo', 'Chae-won', 'Ji-min', 'Ye-eun', 'Yoon-seo', 'Ji-yoon', 'Su-bin', 'Ye-jin', 'Min-ji', 'Hye-jin', 'Eun-ji', 'Ji-hye', 'Yoon-ah', 'Soo-yeon', 'Yeon-woo', 'Hye-won', 'Seung-hee', 'Jung-eun', 'So-young', 'Eun-young', 'Mi-young', 'Jin-ah', 'Hyun-jung', 'Sun-hee', 'Young-mi', 'Hee-jung'],
      last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong', 'Moon', 'Yang', 'Ko', 'Bae', 'Baek', 'Heo', 'Nam', 'Shim', 'Noh', 'Ha']
    }
  },
  IR: { // Иран
    male: {
      first: ['Mohammad', 'Ali', 'Reza', 'Hossein', 'Amir', 'Mehdi', 'Mostafa', 'Ahmad', 'Saeed', 'Hamid', 'Majid', 'Javad', 'Masoud', 'Ehsan', 'Arash', 'Babak', 'Behnam', 'Dariush', 'Farhad', 'Kamran', 'Nima', 'Omid', 'Payam', 'Shahin', 'Siavash', 'Vahid', 'Yasin', 'Kourosh', 'Pouya', 'Saman'],
      last: ['Ahmadi', 'Hosseini', 'Mohammadi', 'Rezaei', 'Karimi', 'Hashemi', 'Mousavi', 'Moradi', 'Jafari', 'Kazemi', 'Rahimi', 'Akbari', 'Taheri', 'Shirazi', 'Farsi', 'Tehrani', 'Esfahani', 'Mashhadi', 'Tabatabaei', 'Sadeghi', 'Bahrami', 'Ghorbani', 'Ebrahimi', 'Norouzi', 'Heydari', 'Zare', 'Seifi', 'Kamali', 'Soltani', 'Abbasi']
    },
    female: {
      first: ['Fatemeh', 'Maryam', 'Zahra', 'Sara', 'Narges', 'Leila', 'Mina', 'Parisa', 'Shirin', 'Nazanin', 'Bahar', 'Golnar', 'Hoda', 'Mahsa', 'Niloufar', 'Roxana', 'Setareh', 'Tara', 'Yasmin', 'Azadeh', 'Elham', 'Farzaneh', 'Ghazal', 'Hasti', 'Kimia', 'Ladan', 'Mona', 'Nasrin', 'Pegah', 'Sahar'],
      last: ['Ahmadi', 'Hosseini', 'Mohammadi', 'Rezaei', 'Karimi', 'Hashemi', 'Mousavi', 'Moradi', 'Jafari', 'Kazemi', 'Rahimi', 'Akbari', 'Taheri', 'Shirazi', 'Farsi', 'Tehrani', 'Esfahani', 'Mashhadi', 'Tabatabaei', 'Sadeghi', 'Bahrami', 'Ghorbani', 'Ebrahimi', 'Norouzi', 'Heydari', 'Zare', 'Seifi', 'Kamali', 'Soltani', 'Abbasi']
    }
  },
  IL: { // Израиль
    male: {
      first: ['David', 'Yosef', 'Moshe', 'Yakov', 'Daniel', 'Noam', 'Idan', 'Itay', 'Omer', 'Ariel', 'Uri', 'Eitan', 'Alon', 'Avi', 'Barak', 'Chen', 'Dor', 'Eran', 'Gal', 'Gilad', 'Guy', 'Lior', 'Matan', 'Nadav', 'Nir', 'Ofir', 'Oren', 'Ron', 'Shai', 'Tal'],
      last: ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Dahan', 'Avraham', 'Friedman', 'Azulay', 'Malka', 'Amar', 'Katz', 'Ohayon', 'Hadad', 'Gabay', 'Yosef', 'Shapira', 'Ben-David', 'Moshe', 'Levy', 'Ashkenazi', 'Segal', 'Schwartz', 'Goldstein', 'Rosenberg', 'Berkowitz', 'Weiss', 'Klein', 'Gross', 'Stern']
    },
    female: {
      first: ['Sarah', 'Rachel', 'Leah', 'Miriam', 'Yael', 'Noa', 'Shira', 'Tamar', 'Maya', 'Tal', 'Chen', 'Mor', 'Michal', 'Efrat', 'Hila', 'Inbar', 'Keren', 'Liora', 'Naama', 'Orly', 'Roni', 'Sapir', 'Tali', 'Yarden', 'Ayelet', 'Dana', 'Gal', 'Hadar', 'Irit', 'Liat'],
      last: ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Dahan', 'Avraham', 'Friedman', 'Azulay', 'Malka', 'Amar', 'Katz', 'Ohayon', 'Hadad', 'Gabay', 'Yosef', 'Shapira', 'Ben-David', 'Moshe', 'Levy', 'Ashkenazi', 'Segal', 'Schwartz', 'Goldstein', 'Rosenberg', 'Berkowitz', 'Weiss', 'Klein', 'Gross', 'Stern']
    }
  }
};

// Маппинг страны на языковую группу для имён (fallback)
const COUNTRY_NAME_FALLBACK: Record<string, string> = {
  // Испаноязычные
  VE: 'ES', UY: 'ES', PY: 'ES', BO: 'ES', CR: 'ES', PA: 'ES', GT: 'ES', HN: 'ES', SV: 'ES', NI: 'ES', DO: 'ES', CU: 'ES', PR: 'ES',
  // Португалоязычные
  PT: 'BR', AO: 'BR', MZ: 'BR',
  // Англоязычные
  GB: 'US', CA: 'US', AU: 'US', NZ: 'US', IE: 'US', ZA: 'US', NG: 'US', GH: 'US', KE: 'US', JM: 'US', TT: 'US',
  // Франкоязычные
  BE: 'FR', CH: 'FR', LU: 'FR', MC: 'FR', SN: 'FR', CI: 'FR', CM: 'FR', MA: 'FR', DZ: 'FR', TN: 'FR',
  // Немецкоязычные
  AT: 'DE', LI: 'DE',
  // Славянские
  BY: 'RU', CZ: 'PL', SK: 'PL', HR: 'PL', SI: 'PL', RS: 'PL', BA: 'PL', MK: 'PL', BG: 'PL',
  // Скандинавские (используем DE как близкие)
  SE: 'DE', NO: 'DE', DK: 'DE', FI: 'DE', IS: 'DE',
  // Прибалтика
  LT: 'PL', LV: 'PL', EE: 'PL',
  // Балканы
  RO: 'IT', GR: 'IT', AL: 'IT', HU: 'DE',
  // Ближний Восток и Северная Африка (арабские)
  EG: 'AR_ARAB', SA: 'AR_ARAB', AE: 'AR_ARAB', QA: 'AR_ARAB', KW: 'AR_ARAB', BH: 'AR_ARAB', OM: 'AR_ARAB', JO: 'AR_ARAB', LB: 'AR_ARAB', SY: 'AR_ARAB', IQ: 'AR_ARAB', YE: 'AR_ARAB', LY: 'AR_ARAB', PS: 'AR_ARAB',
  // Турция и Центральная Азия
  TR: 'TR', AZ: 'TR', TM: 'KZ', UZ: 'KZ', TJ: 'KZ', KG: 'KZ',
  // Восточная Азия
  CN: 'CN', JP: 'JP', KR: 'KR', TW: 'CN', HK: 'CN', MO: 'CN',
  // Юго-Восточная Азия
  MY: 'ID', SG: 'CN', MM: 'TH', KH: 'TH', LA: 'TH', BN: 'ID',
  // Южная Азия
  PK: 'IN', BD: 'IN', LK: 'IN', NP: 'IN', AF: 'IN',
  // Африка
  ET: 'US', TZ: 'US', UG: 'US', ZW: 'US', ZM: 'US', RW: 'US', MW: 'US',
  // Иран, Израиль
  IR: 'IR', IL: 'IL',
  // Монголия
  MN: 'RU',
  // Армения, Грузия
  AM: 'RU', GE: 'RU',
};

// Форматы телефонов по странам
const PHONE_FORMATS: Record<string, { code: string, format: string, example: string }> = {
  // Латинская Америка
  EC: { code: '+593', format: '9XXXXXXXX', example: '+593 9X XXX XXXX' },
  BR: { code: '+55', format: '9XXXXXXXX', example: '+55 XX 9XXXX XXXX' },
  MX: { code: '+52', format: '1XXXXXXXXX', example: '+52 1 XXX XXX XXXX' },
  CO: { code: '+57', format: '3XXXXXXXX', example: '+57 3XX XXX XXXX' },
  AR: { code: '+54', format: '9XXXXXXXXX', example: '+54 9 XX XXXX XXXX' },
  CL: { code: '+56', format: '9XXXXXXXX', example: '+56 9 XXXX XXXX' },
  PE: { code: '+51', format: '9XXXXXXXX', example: '+51 9XX XXX XXX' },
  VE: { code: '+58', format: '4XXXXXXXXX', example: '+58 4XX XXX XXXX' },
  UY: { code: '+598', format: '9XXXXXXX', example: '+598 9X XXX XXX' },
  PY: { code: '+595', format: '9XXXXXXXX', example: '+595 9XX XXX XXX' },
  BO: { code: '+591', format: '7XXXXXXX', example: '+591 7XXX XXXX' },
  CR: { code: '+506', format: '8XXXXXXX', example: '+506 8XXX XXXX' },
  PA: { code: '+507', format: '6XXXXXXX', example: '+507 6XXX XXXX' },
  GT: { code: '+502', format: '5XXXXXXX', example: '+502 5XXX XXXX' },
  HN: { code: '+504', format: '9XXXXXXX', example: '+504 9XXX XXXX' },
  SV: { code: '+503', format: '7XXXXXXX', example: '+503 7XXX XXXX' },
  NI: { code: '+505', format: '8XXXXXXX', example: '+505 8XXX XXXX' },
  DO: { code: '+1', format: '8XXXXXXXXX', example: '+1 809 XXX XXXX' },
  CU: { code: '+53', format: '5XXXXXXX', example: '+53 5XXX XXXX' },
  PR: { code: '+1', format: '7XXXXXXXXX', example: '+1 787 XXX XXXX' },
  // Европа
  ES: { code: '+34', format: '6XXXXXXXX', example: '+34 6XX XX XX XX' },
  IT: { code: '+39', format: '3XXXXXXXX', example: '+39 3XX XXX XXXX' },
  FR: { code: '+33', format: '6XXXXXXXX', example: '+33 6 XX XX XX XX' },
  DE: { code: '+49', format: '15XXXXXXXX', example: '+49 15X XXXXXXXX' },
  PL: { code: '+48', format: '5XXXXXXXX', example: '+48 5XX XXX XXX' },
  GB: { code: '+44', format: '7XXXXXXXXX', example: '+44 7XXX XXX XXX' },
  PT: { code: '+351', format: '9XXXXXXXX', example: '+351 9XX XXX XXX' },
  NL: { code: '+31', format: '6XXXXXXXX', example: '+31 6 XXXX XXXX' },
  BE: { code: '+32', format: '4XXXXXXXX', example: '+32 4XX XX XX XX' },
  CH: { code: '+41', format: '7XXXXXXXX', example: '+41 7X XXX XX XX' },
  AT: { code: '+43', format: '6XXXXXXXX', example: '+43 6XX XXX XXXX' },
  SE: { code: '+46', format: '7XXXXXXXX', example: '+46 7X XXX XX XX' },
  NO: { code: '+47', format: '4XXXXXXXX', example: '+47 4XX XX XXX' },
  DK: { code: '+45', format: 'XXXXXXXX', example: '+45 XX XX XX XX' },
  FI: { code: '+358', format: '4XXXXXXXX', example: '+358 4X XXX XXXX' },
  CZ: { code: '+420', format: '7XXXXXXXX', example: '+420 7XX XXX XXX' },
  SK: { code: '+421', format: '9XXXXXXXX', example: '+421 9XX XXX XXX' },
  HU: { code: '+36', format: '3XXXXXXXX', example: '+36 30 XXX XXXX' },
  RO: { code: '+40', format: '7XXXXXXXX', example: '+40 7XX XXX XXX' },
  BG: { code: '+359', format: '8XXXXXXXX', example: '+359 8X XXX XXXX' },
  GR: { code: '+30', format: '6XXXXXXXXX', example: '+30 6XX XXX XXXX' },
  HR: { code: '+385', format: '9XXXXXXXX', example: '+385 9X XXX XXXX' },
  RS: { code: '+381', format: '6XXXXXXXX', example: '+381 6X XXX XXXX' },
  SI: { code: '+386', format: '4XXXXXXX', example: '+386 4X XXX XXX' },
  BA: { code: '+387', format: '6XXXXXXX', example: '+387 6X XXX XXX' },
  MK: { code: '+389', format: '7XXXXXXX', example: '+389 7X XXX XXX' },
  AL: { code: '+355', format: '6XXXXXXXX', example: '+355 6X XXX XXXX' },
  IE: { code: '+353', format: '8XXXXXXXX', example: '+353 8X XXX XXXX' },
  LT: { code: '+370', format: '6XXXXXXXX', example: '+370 6XX XXXXX' },
  LV: { code: '+371', format: '2XXXXXXX', example: '+371 2X XXX XXX' },
  EE: { code: '+372', format: '5XXXXXXX', example: '+372 5XXX XXXX' },
  BY: { code: '+375', format: '29XXXXXXX', example: '+375 29 XXX XX XX' },
  LU: { code: '+352', format: '6XXXXXXXX', example: '+352 6XX XXX XXX' },
  IS: { code: '+354', format: '8XXXXXX', example: '+354 8XX XXXX' },
  MC: { code: '+377', format: '6XXXXXXXX', example: '+377 6 XX XX XX XX' },
  LI: { code: '+423', format: '7XXXXXXX', example: '+423 7XX XXXX' },
  // СНГ
  RU: { code: '+7', format: '9XXXXXXXXX', example: '+7 9XX XXX XX XX' },
  KZ: { code: '+7', format: '7XXXXXXXXX', example: '+7 7XX XXX XX XX' },
  UZ: { code: '+998', format: '9XXXXXXXX', example: '+998 9X XXX XX XX' },
  TM: { code: '+993', format: '6XXXXXXX', example: '+993 6X XX XX XX' },
  TJ: { code: '+992', format: '9XXXXXXXX', example: '+992 9XX XX XX XX' },
  KG: { code: '+996', format: '7XXXXXXXX', example: '+996 7XX XXX XXX' },
  AM: { code: '+374', format: '9XXXXXXX', example: '+374 9X XXX XXX' },
  GE: { code: '+995', format: '5XXXXXXXX', example: '+995 5XX XXX XXX' },
  AZ: { code: '+994', format: '5XXXXXXXX', example: '+994 5X XXX XX XX' },
  MD: { code: '+373', format: '6XXXXXXXX', example: '+373 6XX XX XXX' },
  // Азия
  IN: { code: '+91', format: '9XXXXXXXXX', example: '+91 9XXX XXX XXX' },
  TH: { code: '+66', format: '8XXXXXXXX', example: '+66 8X XXX XXXX' },
  ID: { code: '+62', format: '8XXXXXXXXX', example: '+62 8XX XXXX XXXX' },
  PH: { code: '+63', format: '9XXXXXXXXX', example: '+63 9XX XXX XXXX' },
  VN: { code: '+84', format: '9XXXXXXXX', example: '+84 9X XXX XX XX' },
  CN: { code: '+86', format: '1XXXXXXXXXX', example: '+86 1XX XXXX XXXX' },
  JP: { code: '+81', format: '9XXXXXXXX', example: '+81 90 XXXX XXXX' },
  KR: { code: '+82', format: '1XXXXXXXXX', example: '+82 10 XXXX XXXX' },
  MY: { code: '+60', format: '1XXXXXXXX', example: '+60 1X XXX XXXX' },
  SG: { code: '+65', format: '9XXXXXXX', example: '+65 9XXX XXXX' },
  TW: { code: '+886', format: '9XXXXXXXX', example: '+886 9XX XXX XXX' },
  HK: { code: '+852', format: '9XXXXXXX', example: '+852 9XXX XXXX' },
  PK: { code: '+92', format: '3XXXXXXXXX', example: '+92 3XX XXX XXXX' },
  BD: { code: '+880', format: '1XXXXXXXXX', example: '+880 1XXX XXX XXX' },
  LK: { code: '+94', format: '7XXXXXXXX', example: '+94 7X XXX XXXX' },
  NP: { code: '+977', format: '98XXXXXXXX', example: '+977 98XX XXX XXX' },
  MM: { code: '+95', format: '9XXXXXXXX', example: '+95 9XX XXX XXX' },
  KH: { code: '+855', format: '9XXXXXXXX', example: '+855 9X XXX XXXX' },
  LA: { code: '+856', format: '20XXXXXXX', example: '+856 20 XX XXX XXX' },
  MN: { code: '+976', format: '9XXXXXXX', example: '+976 9XXX XXXX' },
  AF: { code: '+93', format: '7XXXXXXXX', example: '+93 7XX XXX XXX' },
  BN: { code: '+673', format: '8XXXXXX', example: '+673 8XX XXXX' },
  // Ближний Восток
  TR: { code: '+90', format: '5XXXXXXXXX', example: '+90 5XX XXX XX XX' },
  SA: { code: '+966', format: '5XXXXXXXX', example: '+966 5X XXX XXXX' },
  AE: { code: '+971', format: '5XXXXXXXX', example: '+971 5X XXX XXXX' },
  EG: { code: '+20', format: '1XXXXXXXXX', example: '+20 1XX XXX XXXX' },
  IL: { code: '+972', format: '5XXXXXXXX', example: '+972 5X XXX XXXX' },
  IR: { code: '+98', format: '9XXXXXXXXX', example: '+98 9XX XXX XXXX' },
  IQ: { code: '+964', format: '7XXXXXXXXX', example: '+964 7XX XXX XXXX' },
  JO: { code: '+962', format: '7XXXXXXXX', example: '+962 7X XXX XXXX' },
  LB: { code: '+961', format: '7XXXXXXX', example: '+961 7X XXX XXX' },
  SY: { code: '+963', format: '9XXXXXXXX', example: '+963 9XX XXX XXX' },
  KW: { code: '+965', format: '9XXXXXXX', example: '+965 9XXX XXXX' },
  QA: { code: '+974', format: '5XXXXXXX', example: '+974 5XXX XXXX' },
  BH: { code: '+973', format: '3XXXXXXX', example: '+973 3XXX XXXX' },
  OM: { code: '+968', format: '9XXXXXXX', example: '+968 9XXX XXXX' },
  YE: { code: '+967', format: '7XXXXXXXX', example: '+967 7XX XXX XXX' },
  PS: { code: '+970', format: '5XXXXXXXX', example: '+970 5X XXX XXXX' },
  // Африка
  MA: { code: '+212', format: '6XXXXXXXX', example: '+212 6XX XX XX XX' },
  DZ: { code: '+213', format: '5XXXXXXXX', example: '+213 5XX XX XX XX' },
  TN: { code: '+216', format: '9XXXXXXX', example: '+216 9X XXX XXX' },
  LY: { code: '+218', format: '9XXXXXXXX', example: '+218 9X XXX XXXX' },
  ZA: { code: '+27', format: '8XXXXXXXX', example: '+27 8X XXX XXXX' },
  NG: { code: '+234', format: '8XXXXXXXXX', example: '+234 8XX XXX XXXX' },
  KE: { code: '+254', format: '7XXXXXXXX', example: '+254 7XX XXX XXX' },
  GH: { code: '+233', format: '5XXXXXXXX', example: '+233 5X XXX XXXX' },
  ET: { code: '+251', format: '9XXXXXXXX', example: '+251 9XX XXX XXX' },
  TZ: { code: '+255', format: '7XXXXXXXX', example: '+255 7XX XXX XXX' },
  UG: { code: '+256', format: '7XXXXXXXX', example: '+256 7XX XXX XXX' },
  SN: { code: '+221', format: '7XXXXXXXX', example: '+221 7X XXX XX XX' },
  CI: { code: '+225', format: '07XXXXXXXX', example: '+225 07 XX XX XX XX' },
  CM: { code: '+237', format: '6XXXXXXXX', example: '+237 6XX XX XX XX' },
  AO: { code: '+244', format: '9XXXXXXXX', example: '+244 9XX XXX XXX' },
  MZ: { code: '+258', format: '8XXXXXXXX', example: '+258 8X XXX XXXX' },
  ZW: { code: '+263', format: '7XXXXXXXX', example: '+263 7X XXX XXXX' },
  ZM: { code: '+260', format: '9XXXXXXXX', example: '+260 9X XXX XXXX' },
  RW: { code: '+250', format: '7XXXXXXXX', example: '+250 7XX XXX XXX' },
  MW: { code: '+265', format: '9XXXXXXXX', example: '+265 9XX XX XX XX' },
  // Океания
  AU: { code: '+61', format: '4XXXXXXXX', example: '+61 4XX XXX XXX' },
  NZ: { code: '+64', format: '2XXXXXXXX', example: '+64 2X XXX XXXX' },
  // Северная Америка
  US: { code: '+1', format: 'XXXXXXXXXX', example: '+1 XXX XXX XXXX' },
  CA: { code: '+1', format: 'XXXXXXXXXX', example: '+1 XXX XXX XXXX' },
  // Карибы
  JM: { code: '+1', format: '8XXXXXXXXX', example: '+1 876 XXX XXXX' },
  TT: { code: '+1', format: '8XXXXXXXXX', example: '+1 868 XXX XXXX' },
};

// Email домены по странам
const EMAIL_DOMAINS: Record<string, string[]> = {
  EC: ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'],
  BR: ['gmail.com', 'hotmail.com', 'outlook.com', 'uol.com.br', 'bol.com.br'],
  MX: ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.mx', 'prodigy.net.mx'],
  CO: ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'],
  AR: ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.ar'],
  CL: ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'],
  PE: ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'],
  ES: ['gmail.com', 'hotmail.es', 'outlook.es', 'yahoo.es', 'telefonica.net'],
  IT: ['gmail.com', 'libero.it', 'virgilio.it', 'alice.it', 'tiscali.it'],
  FR: ['gmail.com', 'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net'],
  DE: ['gmail.com', 'gmx.de', 'web.de', 't-online.de', 'freenet.de'],
  PL: ['gmail.com', 'wp.pl', 'onet.pl', 'interia.pl', 'o2.pl'],
  US: ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'aol.com'],
  RU: ['gmail.com', 'mail.ru', 'yandex.ru', 'rambler.ru', 'bk.ru'],
  KZ: ['gmail.com', 'mail.ru', 'yandex.kz', 'inbox.ru'],
  IN: ['gmail.com', 'yahoo.co.in', 'rediffmail.com', 'outlook.com'],
  TH: ['gmail.com', 'hotmail.com', 'yahoo.co.th', 'outlook.com'],
  ID: ['gmail.com', 'yahoo.co.id', 'hotmail.com', 'outlook.com'],
  PH: ['gmail.com', 'yahoo.com.ph', 'hotmail.com', 'outlook.com'],
  VN: ['gmail.com', 'yahoo.com.vn', 'hotmail.com', 'outlook.com'],
};

// Список стран для выбора (все страны мира кроме Украины)
const COUNTRIES = [
  // Европа
  { code: 'AL', name: 'Албания', flag: '🇦🇱' },
  { code: 'AD', name: 'Андорра', flag: '🇦🇩' },
  { code: 'AT', name: 'Австрия', flag: '🇦🇹' },
  { code: 'BY', name: 'Беларусь', flag: '🇧🇾' },
  { code: 'BE', name: 'Бельгия', flag: '🇧🇪' },
  { code: 'BA', name: 'Босния и Герцеговина', flag: '🇧🇦' },
  { code: 'BG', name: 'Болгария', flag: '🇧🇬' },
  { code: 'HR', name: 'Хорватия', flag: '🇭🇷' },
  { code: 'CY', name: 'Кипр', flag: '🇨🇾' },
  { code: 'CZ', name: 'Чехия', flag: '🇨🇿' },
  { code: 'DK', name: 'Дания', flag: '🇩🇰' },
  { code: 'EE', name: 'Эстония', flag: '🇪🇪' },
  { code: 'FI', name: 'Финляндия', flag: '🇫🇮' },
  { code: 'FR', name: 'Франция', flag: '🇫🇷' },
  { code: 'DE', name: 'Германия', flag: '🇩🇪' },
  { code: 'GR', name: 'Греция', flag: '🇬🇷' },
  { code: 'HU', name: 'Венгрия', flag: '🇭🇺' },
  { code: 'IS', name: 'Исландия', flag: '🇮🇸' },
  { code: 'IE', name: 'Ирландия', flag: '🇮🇪' },
  { code: 'IT', name: 'Италия', flag: '🇮🇹' },
  { code: 'LV', name: 'Латвия', flag: '🇱🇻' },
  { code: 'LI', name: 'Лихтенштейн', flag: '🇱🇮' },
  { code: 'LT', name: 'Литва', flag: '🇱🇹' },
  { code: 'LU', name: 'Люксембург', flag: '🇱🇺' },
  { code: 'MT', name: 'Мальта', flag: '🇲🇹' },
  { code: 'MD', name: 'Молдова', flag: '🇲🇩' },
  { code: 'MC', name: 'Монако', flag: '🇲🇨' },
  { code: 'ME', name: 'Черногория', flag: '🇲🇪' },
  { code: 'NL', name: 'Нидерланды', flag: '🇳🇱' },
  { code: 'MK', name: 'Северная Македония', flag: '🇲🇰' },
  { code: 'NO', name: 'Норвегия', flag: '🇳🇴' },
  { code: 'PL', name: 'Польша', flag: '🇵🇱' },
  { code: 'PT', name: 'Португалия', flag: '🇵🇹' },
  { code: 'RO', name: 'Румыния', flag: '🇷🇴' },
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'SM', name: 'Сан-Марино', flag: '🇸🇲' },
  { code: 'RS', name: 'Сербия', flag: '🇷🇸' },
  { code: 'SK', name: 'Словакия', flag: '🇸🇰' },
  { code: 'SI', name: 'Словения', flag: '🇸🇮' },
  { code: 'ES', name: 'Испания', flag: '🇪🇸' },
  { code: 'SE', name: 'Швеция', flag: '🇸🇪' },
  { code: 'CH', name: 'Швейцария', flag: '🇨🇭' },
  { code: 'GB', name: 'Великобритания', flag: '🇬🇧' },
  { code: 'VA', name: 'Ватикан', flag: '🇻🇦' },
  // Азия
  { code: 'AF', name: 'Афганистан', flag: '🇦🇫' },
  { code: 'AM', name: 'Армения', flag: '🇦🇲' },
  { code: 'AZ', name: 'Азербайджан', flag: '🇦🇿' },
  { code: 'BH', name: 'Бахрейн', flag: '🇧🇭' },
  { code: 'BD', name: 'Бангладеш', flag: '🇧🇩' },
  { code: 'BT', name: 'Бутан', flag: '🇧🇹' },
  { code: 'BN', name: 'Бруней', flag: '🇧🇳' },
  { code: 'KH', name: 'Камбоджа', flag: '🇰🇭' },
  { code: 'CN', name: 'Китай', flag: '🇨🇳' },
  { code: 'GE', name: 'Грузия', flag: '🇬🇪' },
  { code: 'HK', name: 'Гонконг', flag: '🇭🇰' },
  { code: 'IN', name: 'Индия', flag: '🇮🇳' },
  { code: 'ID', name: 'Индонезия', flag: '🇮🇩' },
  { code: 'IR', name: 'Иран', flag: '🇮🇷' },
  { code: 'IQ', name: 'Ирак', flag: '🇮🇶' },
  { code: 'IL', name: 'Израиль', flag: '🇮🇱' },
  { code: 'JP', name: 'Япония', flag: '🇯🇵' },
  { code: 'JO', name: 'Иордания', flag: '🇯🇴' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿' },
  { code: 'KW', name: 'Кувейт', flag: '🇰🇼' },
  { code: 'KG', name: 'Кыргызстан', flag: '🇰🇬' },
  { code: 'LA', name: 'Лаос', flag: '🇱🇦' },
  { code: 'LB', name: 'Ливан', flag: '🇱🇧' },
  { code: 'MO', name: 'Макао', flag: '🇲🇴' },
  { code: 'MY', name: 'Малайзия', flag: '🇲🇾' },
  { code: 'MV', name: 'Мальдивы', flag: '🇲🇻' },
  { code: 'MN', name: 'Монголия', flag: '🇲🇳' },
  { code: 'MM', name: 'Мьянма', flag: '🇲🇲' },
  { code: 'NP', name: 'Непал', flag: '🇳🇵' },
  { code: 'KP', name: 'Северная Корея', flag: '🇰🇵' },
  { code: 'OM', name: 'Оман', flag: '🇴🇲' },
  { code: 'PK', name: 'Пакистан', flag: '🇵🇰' },
  { code: 'PS', name: 'Палестина', flag: '🇵🇸' },
  { code: 'PH', name: 'Филиппины', flag: '🇵🇭' },
  { code: 'QA', name: 'Катар', flag: '🇶🇦' },
  { code: 'SA', name: 'Саудовская Аравия', flag: '🇸🇦' },
  { code: 'SG', name: 'Сингапур', flag: '🇸🇬' },
  { code: 'KR', name: 'Южная Корея', flag: '🇰🇷' },
  { code: 'LK', name: 'Шри-Ланка', flag: '🇱🇰' },
  { code: 'SY', name: 'Сирия', flag: '🇸🇾' },
  { code: 'TW', name: 'Тайвань', flag: '🇹🇼' },
  { code: 'TJ', name: 'Таджикистан', flag: '🇹🇯' },
  { code: 'TH', name: 'Таиланд', flag: '🇹🇭' },
  { code: 'TL', name: 'Восточный Тимор', flag: '🇹🇱' },
  { code: 'TR', name: 'Турция', flag: '🇹🇷' },
  { code: 'TM', name: 'Туркменистан', flag: '🇹🇲' },
  { code: 'AE', name: 'ОАЭ', flag: '🇦🇪' },
  { code: 'UZ', name: 'Узбекистан', flag: '🇺🇿' },
  { code: 'VN', name: 'Вьетнам', flag: '🇻🇳' },
  { code: 'YE', name: 'Йемен', flag: '🇾🇪' },
  // Африка
  { code: 'DZ', name: 'Алжир', flag: '🇩🇿' },
  { code: 'AO', name: 'Ангола', flag: '🇦🇴' },
  { code: 'BJ', name: 'Бенин', flag: '🇧🇯' },
  { code: 'BW', name: 'Ботсвана', flag: '🇧🇼' },
  { code: 'BF', name: 'Буркина-Фасо', flag: '🇧🇫' },
  { code: 'BI', name: 'Бурунди', flag: '🇧🇮' },
  { code: 'CM', name: 'Камерун', flag: '🇨🇲' },
  { code: 'CV', name: 'Кабо-Верде', flag: '🇨🇻' },
  { code: 'CF', name: 'ЦАР', flag: '🇨🇫' },
  { code: 'TD', name: 'Чад', flag: '🇹🇩' },
  { code: 'KM', name: 'Коморы', flag: '🇰🇲' },
  { code: 'CD', name: 'ДР Конго', flag: '🇨🇩' },
  { code: 'CG', name: 'Конго', flag: '🇨🇬' },
  { code: 'CI', name: 'Кот-д\'Ивуар', flag: '🇨🇮' },
  { code: 'DJ', name: 'Джибути', flag: '🇩🇯' },
  { code: 'EG', name: 'Египет', flag: '🇪🇬' },
  { code: 'GQ', name: 'Экваториальная Гвинея', flag: '🇬🇶' },
  { code: 'ER', name: 'Эритрея', flag: '🇪🇷' },
  { code: 'SZ', name: 'Эсватини', flag: '🇸🇿' },
  { code: 'ET', name: 'Эфиопия', flag: '🇪🇹' },
  { code: 'GA', name: 'Габон', flag: '🇬🇦' },
  { code: 'GM', name: 'Гамбия', flag: '🇬🇲' },
  { code: 'GH', name: 'Гана', flag: '🇬🇭' },
  { code: 'GN', name: 'Гвинея', flag: '🇬🇳' },
  { code: 'GW', name: 'Гвинея-Бисау', flag: '🇬🇼' },
  { code: 'KE', name: 'Кения', flag: '🇰🇪' },
  { code: 'LS', name: 'Лесото', flag: '🇱🇸' },
  { code: 'LR', name: 'Либерия', flag: '🇱🇷' },
  { code: 'LY', name: 'Ливия', flag: '🇱🇾' },
  { code: 'MG', name: 'Мадагаскар', flag: '🇲🇬' },
  { code: 'MW', name: 'Малави', flag: '🇲🇼' },
  { code: 'ML', name: 'Мали', flag: '🇲🇱' },
  { code: 'MR', name: 'Мавритания', flag: '🇲🇷' },
  { code: 'MU', name: 'Маврикий', flag: '🇲🇺' },
  { code: 'MA', name: 'Марокко', flag: '🇲🇦' },
  { code: 'MZ', name: 'Мозамбик', flag: '🇲🇿' },
  { code: 'NA', name: 'Намибия', flag: '🇳🇦' },
  { code: 'NE', name: 'Нигер', flag: '🇳🇪' },
  { code: 'NG', name: 'Нигерия', flag: '🇳🇬' },
  { code: 'RW', name: 'Руанда', flag: '🇷🇼' },
  { code: 'ST', name: 'Сан-Томе и Принсипи', flag: '🇸🇹' },
  { code: 'SN', name: 'Сенегал', flag: '🇸🇳' },
  { code: 'SC', name: 'Сейшелы', flag: '🇸🇨' },
  { code: 'SL', name: 'Сьерра-Леоне', flag: '🇸🇱' },
  { code: 'SO', name: 'Сомали', flag: '🇸🇴' },
  { code: 'ZA', name: 'ЮАР', flag: '🇿🇦' },
  { code: 'SS', name: 'Южный Судан', flag: '🇸🇸' },
  { code: 'SD', name: 'Судан', flag: '🇸🇩' },
  { code: 'TZ', name: 'Танзания', flag: '🇹🇿' },
  { code: 'TG', name: 'Того', flag: '🇹🇬' },
  { code: 'TN', name: 'Тунис', flag: '🇹🇳' },
  { code: 'UG', name: 'Уганда', flag: '🇺🇬' },
  { code: 'ZM', name: 'Замбия', flag: '🇿🇲' },
  { code: 'ZW', name: 'Зимбабве', flag: '🇿🇼' },
  // Северная Америка
  { code: 'CA', name: 'Канада', flag: '🇨🇦' },
  { code: 'US', name: 'США', flag: '🇺🇸' },
  // Центральная Америка и Карибы
  { code: 'AG', name: 'Антигуа и Барбуда', flag: '🇦🇬' },
  { code: 'BS', name: 'Багамы', flag: '🇧🇸' },
  { code: 'BB', name: 'Барбадос', flag: '🇧🇧' },
  { code: 'BZ', name: 'Белиз', flag: '🇧🇿' },
  { code: 'CR', name: 'Коста-Рика', flag: '🇨🇷' },
  { code: 'CU', name: 'Куба', flag: '🇨🇺' },
  { code: 'DM', name: 'Доминика', flag: '🇩🇲' },
  { code: 'DO', name: 'Доминиканская Республика', flag: '🇩🇴' },
  { code: 'SV', name: 'Сальвадор', flag: '🇸🇻' },
  { code: 'GD', name: 'Гренада', flag: '🇬🇩' },
  { code: 'GT', name: 'Гватемала', flag: '🇬🇹' },
  { code: 'HT', name: 'Гаити', flag: '🇭🇹' },
  { code: 'HN', name: 'Гондурас', flag: '🇭🇳' },
  { code: 'JM', name: 'Ямайка', flag: '🇯🇲' },
  { code: 'MX', name: 'Мексика', flag: '🇲🇽' },
  { code: 'NI', name: 'Никарагуа', flag: '🇳🇮' },
  { code: 'PA', name: 'Панама', flag: '🇵🇦' },
  { code: 'PR', name: 'Пуэрто-Рико', flag: '🇵🇷' },
  { code: 'KN', name: 'Сент-Китс и Невис', flag: '🇰🇳' },
  { code: 'LC', name: 'Сент-Люсия', flag: '🇱🇨' },
  { code: 'VC', name: 'Сент-Винсент и Гренадины', flag: '🇻🇨' },
  { code: 'TT', name: 'Тринидад и Тобаго', flag: '🇹🇹' },
  // Южная Америка
  { code: 'AR', name: 'Аргентина', flag: '🇦🇷' },
  { code: 'BO', name: 'Боливия', flag: '🇧🇴' },
  { code: 'BR', name: 'Бразилия', flag: '🇧🇷' },
  { code: 'CL', name: 'Чили', flag: '🇨🇱' },
  { code: 'CO', name: 'Колумбия', flag: '🇨🇴' },
  { code: 'EC', name: 'Эквадор', flag: '🇪🇨' },
  { code: 'GY', name: 'Гайана', flag: '🇬🇾' },
  { code: 'PY', name: 'Парагвай', flag: '🇵🇾' },
  { code: 'PE', name: 'Перу', flag: '🇵🇪' },
  { code: 'SR', name: 'Суринам', flag: '🇸🇷' },
  { code: 'UY', name: 'Уругвай', flag: '🇺🇾' },
  { code: 'VE', name: 'Венесуэла', flag: '🇻🇪' },
  // Океания
  { code: 'AU', name: 'Австралия', flag: '🇦🇺' },
  { code: 'FJ', name: 'Фиджи', flag: '🇫🇯' },
  { code: 'KI', name: 'Кирибати', flag: '🇰🇮' },
  { code: 'MH', name: 'Маршалловы Острова', flag: '🇲🇭' },
  { code: 'FM', name: 'Микронезия', flag: '🇫🇲' },
  { code: 'NR', name: 'Науру', flag: '🇳🇷' },
  { code: 'NZ', name: 'Новая Зеландия', flag: '🇳🇿' },
  { code: 'PW', name: 'Палау', flag: '🇵🇼' },
  { code: 'PG', name: 'Папуа — Новая Гвинея', flag: '🇵🇬' },
  { code: 'WS', name: 'Самоа', flag: '🇼🇸' },
  { code: 'SB', name: 'Соломоновы Острова', flag: '🇸🇧' },
  { code: 'TO', name: 'Тонга', flag: '🇹🇴' },
  { code: 'TV', name: 'Тувалу', flag: '🇹🇻' },
  { code: 'VU', name: 'Вануату', flag: '🇻🇺' },
].sort((a, b) => a.name.localeCompare(b.name, 'ru'));

function DataGenerator() {
  const [country, setCountry] = useState('EC');
  const [dataType, setDataType] = useState<DataType>('name');
  const [gender, setGender] = useState<Gender>('random');
  const [count, setCount] = useState(5);
  const [generated, setGenerated] = useState<GeneratedItem[]>([]);

  const random = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const generateName = useCallback((countryCode: string, genderChoice: Gender): string => {
    // Используем fallback если нет данных для страны
    let data = NAMES_DATABASE[countryCode];
    if (!data) {
      const fallbackCode = COUNTRY_NAME_FALLBACK[countryCode];
      data = fallbackCode ? NAMES_DATABASE[fallbackCode] : NAMES_DATABASE['US'];
    }
    if (!data) return 'John Doe';
    
    const actualGender = genderChoice === 'random' 
      ? (Math.random() > 0.5 ? 'male' : 'female') 
      : genderChoice;
    
    const names = data[actualGender];
    return `${random(names.first)} ${random(names.last)}`;
  }, []);

  const generatePhone = useCallback((countryCode: string): string => {
    const format = PHONE_FORMATS[countryCode];
    if (!format) {
      // Генерируем универсальный номер если формат не найден
      const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
      return `+${Math.floor(Math.random() * 900) + 1} ${digits}`;
    }
    
    let number = format.format;
    for (let i = 0; i < number.length; i++) {
      if (number[i] === 'X') {
        number = number.slice(0, i) + Math.floor(Math.random() * 10) + number.slice(i + 1);
      }
    }
    
    return `${format.code} ${number}`;
  }, []);

  const generateEmail = useCallback((countryCode: string, genderChoice: Gender): string => {
    // Используем fallback если нет данных для страны
    let data = NAMES_DATABASE[countryCode];
    if (!data) {
      const fallbackCode = COUNTRY_NAME_FALLBACK[countryCode];
      data = fallbackCode ? NAMES_DATABASE[fallbackCode] : NAMES_DATABASE['US'];
    }
    const domains = EMAIL_DOMAINS[countryCode] || ['gmail.com', 'yahoo.com', 'outlook.com'];
    
    if (!data) return 'user@gmail.com';
    
    const actualGender = genderChoice === 'random' 
      ? (Math.random() > 0.5 ? 'male' : 'female') 
      : genderChoice;
    
    const names = data[actualGender];
    const firstName = random(names.first).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const lastName = random(names.last).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const num = Math.floor(Math.random() * 999);
    const domain = random(domains);
    
    const formats = [
      `${firstName}.${lastName}@${domain}`,
      `${firstName}${lastName}${num}@${domain}`,
      `${firstName}_${lastName}@${domain}`,
      `${firstName}${num}@${domain}`,
    ];
    
    return random(formats);
  }, []);

  const generate = useCallback(() => {
    const items: GeneratedItem[] = [];
    
    for (let i = 0; i < count; i++) {
      let value = '';
      
      switch (dataType) {
        case 'name':
          value = generateName(country, gender);
          break;
        case 'phone':
          value = generatePhone(country);
          break;
        case 'email':
          value = generateEmail(country, gender);
          break;
      }
      
      items.push({
        id: crypto.randomUUID(),
        type: dataType,
        value,
        copied: false,
      });
    }
    
    setGenerated(items);
  }, [country, dataType, gender, count, generateName, generatePhone, generateEmail]);

  const copyToClipboard = useCallback(async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setGenerated(prev => prev.map(item => 
        item.id === id ? { ...item, copied: true } : item
      ));
      setTimeout(() => {
        setGenerated(prev => prev.map(item => 
          item.id === id ? { ...item, copied: false } : item
        ));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const copyAll = useCallback(async () => {
    const allValues = generated.map(item => item.value).join('\n');
    try {
      await navigator.clipboard.writeText(allValues);
      setGenerated(prev => prev.map(item => ({ ...item, copied: true })));
      setTimeout(() => {
        setGenerated(prev => prev.map(item => ({ ...item, copied: false })));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [generated]);

  const currentCountry = COUNTRIES.find(c => c.code === country);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            to="/tools"
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            ← Инструменты
          </Link>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Генератор данных</h1>
          <p className="text-sm text-dark-400">Создание случайных имён, телефонов и email для разных гео</p>
        </div>
      </div>

      {/* Settings */}
      <div className="glass-card p-4 sm:p-5 mb-6 flex-shrink-0">
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6">
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Гео (страна)
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="glass-input w-full"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data Type */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Тип данных
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => setDataType('name')}
                className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                  dataType === 'name'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                <UserCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Имя</span>
              </button>
              <button
                onClick={() => setDataType('phone')}
                className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                  dataType === 'phone'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Телефон</span>
              </button>
              <button
                onClick={() => setDataType('email')}
                className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                  dataType === 'email'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* Gender (only for name and email) */}
          {(dataType === 'name' || dataType === 'email') && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Пол
              </label>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    gender === 'male'
                      ? 'bg-blue-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  Муж
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    gender === 'female'
                      ? 'bg-pink-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  Жен
                </button>
                <button
                  onClick={() => setGender('random')}
                  className={`flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    gender === 'random'
                      ? 'bg-purple-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  Любой
                </button>
              </div>
            </div>
          )}

          {/* Count */}
          <div className={dataType === 'phone' ? 'sm:col-span-2 lg:col-span-1' : ''}>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Количество: {count}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-dark-500 mt-1">
              <span>1</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-dark-400 hidden sm:block">
            {currentCountry && (
              <span>
                {currentCountry.flag} {currentCountry.name}
                {dataType === 'phone' && PHONE_FORMATS[country] && (
                  <span className="ml-2 text-dark-500">
                    Формат: {PHONE_FORMATS[country].example}
                  </span>
                )}
              </span>
            )}
          </div>
          <button
            onClick={generate}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Сгенерировать
          </button>
        </div>
      </div>

      {/* Results */}
      {generated.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <span className="text-sm text-dark-400">
              Сгенерировано: {generated.length}
            </span>
            <button
              onClick={copyAll}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Copy className="w-4 h-4" />
              Копировать всё
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {generated.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-dark-700/50 rounded-xl px-4 py-3 group hover:bg-dark-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center flex-shrink-0">
                    {item.type === 'name' && <UserCircle className="w-4 h-4 text-purple-400" />}
                    {item.type === 'phone' && <Phone className="w-4 h-4 text-green-400" />}
                    {item.type === 'email' && <Mail className="w-4 h-4 text-blue-400" />}
                  </div>
                  
                  <span className="flex-1 text-dark-100 font-medium select-all">
                    {item.value}
                  </span>
                  
                  <button
                    onClick={() => copyToClipboard(item.id, item.value)}
                    className={`p-2 rounded-lg transition-all ${
                      item.copied 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-dark-600 text-dark-400 hover:text-dark-200 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {item.copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {generated.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-dark-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Выберите параметры и нажмите "Сгенерировать"</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataGenerator;

