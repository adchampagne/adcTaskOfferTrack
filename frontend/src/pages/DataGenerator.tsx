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
  UA: { // Украина
    male: {
      first: ['Олександр', 'Максим', 'Артем', 'Дмитро', 'Андрій', 'Богдан', 'Владислав', 'Микола', 'Іван', 'Михайло', 'Денис', 'Євген', 'Віталій', 'Роман', 'Олег', 'Сергій', 'Володимир', 'Ярослав', 'Назар', 'Тарас', 'Павло', 'Юрій', 'Василь', 'Петро', 'Ігор', 'Олексій', 'Вадим', 'Станіслав', 'Тимур', 'Кирило', 'Данило', 'Нікіта', 'Марко', 'Леонід', 'Григорій'],
      last: ['Шевченко', 'Бондаренко', 'Коваленко', 'Бойко', 'Ткаченко', 'Кравченко', 'Олійник', 'Шевчук', 'Поліщук', 'Коваль', 'Бондар', 'Ткачук', 'Марченко', 'Савченко', 'Руденко', 'Мельник', 'Сидоренко', 'Петренко', 'Іваненко', 'Павленко', 'Литвиненко', 'Мороз', 'Лисенко', 'Гончаренко', 'Левченко', 'Кузьменко', 'Клименко', 'Пономаренко', 'Гриценко', 'Романенко', 'Степаненко', 'Федоренко', 'Тимошенко', 'Дяченко', 'Захарченко']
    },
    female: {
      first: ['Анна', 'Марія', 'Софія', 'Вікторія', 'Дарина', 'Анастасія', 'Катерина', 'Юлія', 'Ольга', 'Наталія', 'Тетяна', 'Ірина', 'Оксана', 'Олена', 'Світлана', 'Валентина', 'Людмила', 'Галина', 'Надія', 'Любов', 'Леся', 'Христина', 'Аліна', 'Діана', 'Яна', 'Марина', 'Злата', 'Вероніка', 'Поліна', 'Євгенія', 'Алла', 'Інна', 'Лариса', 'Зоя', 'Віра'],
      last: ['Шевченко', 'Бондаренко', 'Коваленко', 'Бойко', 'Ткаченко', 'Кравченко', 'Олійник', 'Шевчук', 'Поліщук', 'Коваль', 'Бондар', 'Ткачук', 'Марченко', 'Савченко', 'Руденко', 'Мельник', 'Сидоренко', 'Петренко', 'Іваненко', 'Павленко', 'Литвиненко', 'Мороз', 'Лисенко', 'Гончаренко', 'Левченко', 'Кузьменко', 'Клименко', 'Пономаренко', 'Гриценко', 'Романенко', 'Степаненко', 'Федоренко', 'Тимошенко', 'Дяченко', 'Захарченко']
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
  }
};

// Форматы телефонов по странам
const PHONE_FORMATS: Record<string, { code: string, format: string, example: string }> = {
  EC: { code: '+593', format: '9XXXXXXXX', example: '+593 9X XXX XXXX' },
  BR: { code: '+55', format: '9XXXXXXXX', example: '+55 XX 9XXXX XXXX' },
  MX: { code: '+52', format: '1XXXXXXXXX', example: '+52 1 XXX XXX XXXX' },
  CO: { code: '+57', format: '3XXXXXXXX', example: '+57 3XX XXX XXXX' },
  AR: { code: '+54', format: '9XXXXXXXXX', example: '+54 9 XX XXXX XXXX' },
  CL: { code: '+56', format: '9XXXXXXXX', example: '+56 9 XXXX XXXX' },
  PE: { code: '+51', format: '9XXXXXXXX', example: '+51 9XX XXX XXX' },
  ES: { code: '+34', format: '6XXXXXXXX', example: '+34 6XX XX XX XX' },
  IT: { code: '+39', format: '3XXXXXXXX', example: '+39 3XX XXX XXXX' },
  FR: { code: '+33', format: '6XXXXXXXX', example: '+33 6 XX XX XX XX' },
  DE: { code: '+49', format: '15XXXXXXXX', example: '+49 15X XXXXXXXX' },
  PL: { code: '+48', format: '5XXXXXXXX', example: '+48 5XX XXX XXX' },
  US: { code: '+1', format: 'XXXXXXXXXX', example: '+1 XXX XXX XXXX' },
  RU: { code: '+7', format: '9XXXXXXXXX', example: '+7 9XX XXX XX XX' },
  UA: { code: '+380', format: '9XXXXXXXX', example: '+380 9X XXX XX XX' },
  KZ: { code: '+7', format: '7XXXXXXXXX', example: '+7 7XX XXX XX XX' },
  IN: { code: '+91', format: '9XXXXXXXXX', example: '+91 9XXX XXX XXX' },
  TH: { code: '+66', format: '8XXXXXXXX', example: '+66 8X XXX XXXX' },
  ID: { code: '+62', format: '8XXXXXXXXX', example: '+62 8XX XXXX XXXX' },
  PH: { code: '+63', format: '9XXXXXXXXX', example: '+63 9XX XXX XXXX' },
  VN: { code: '+84', format: '9XXXXXXXX', example: '+84 9X XXX XX XX' },
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
  UA: ['gmail.com', 'ukr.net', 'i.ua', 'meta.ua', 'bigmir.net'],
  KZ: ['gmail.com', 'mail.ru', 'yandex.kz', 'inbox.ru'],
  IN: ['gmail.com', 'yahoo.co.in', 'rediffmail.com', 'outlook.com'],
  TH: ['gmail.com', 'hotmail.com', 'yahoo.co.th', 'outlook.com'],
  ID: ['gmail.com', 'yahoo.co.id', 'hotmail.com', 'outlook.com'],
  PH: ['gmail.com', 'yahoo.com.ph', 'hotmail.com', 'outlook.com'],
  VN: ['gmail.com', 'yahoo.com.vn', 'hotmail.com', 'outlook.com'],
};

// Список стран для выбора
const COUNTRIES = [
  { code: 'EC', name: 'Эквадор', flag: '🇪🇨' },
  { code: 'BR', name: 'Бразилия', flag: '🇧🇷' },
  { code: 'MX', name: 'Мексика', flag: '🇲🇽' },
  { code: 'CO', name: 'Колумбия', flag: '🇨🇴' },
  { code: 'AR', name: 'Аргентина', flag: '🇦🇷' },
  { code: 'CL', name: 'Чили', flag: '🇨🇱' },
  { code: 'PE', name: 'Перу', flag: '🇵🇪' },
  { code: 'ES', name: 'Испания', flag: '🇪🇸' },
  { code: 'IT', name: 'Италия', flag: '🇮🇹' },
  { code: 'FR', name: 'Франция', flag: '🇫🇷' },
  { code: 'DE', name: 'Германия', flag: '🇩🇪' },
  { code: 'PL', name: 'Польша', flag: '🇵🇱' },
  { code: 'US', name: 'США', flag: '🇺🇸' },
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'UA', name: 'Украина', flag: '🇺🇦' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿' },
  { code: 'IN', name: 'Индия', flag: '🇮🇳' },
  { code: 'TH', name: 'Таиланд', flag: '🇹🇭' },
  { code: 'ID', name: 'Индонезия', flag: '🇮🇩' },
  { code: 'PH', name: 'Филиппины', flag: '🇵🇭' },
  { code: 'VN', name: 'Вьетнам', flag: '🇻🇳' },
];

function DataGenerator() {
  const [country, setCountry] = useState('EC');
  const [dataType, setDataType] = useState<DataType>('name');
  const [gender, setGender] = useState<Gender>('random');
  const [count, setCount] = useState(5);
  const [generated, setGenerated] = useState<GeneratedItem[]>([]);

  const random = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const generateName = useCallback((countryCode: string, genderChoice: Gender): string => {
    const data = NAMES_DATABASE[countryCode];
    if (!data) return 'John Doe';
    
    const actualGender = genderChoice === 'random' 
      ? (Math.random() > 0.5 ? 'male' : 'female') 
      : genderChoice;
    
    const names = data[actualGender];
    return `${random(names.first)} ${random(names.last)}`;
  }, []);

  const generatePhone = useCallback((countryCode: string): string => {
    const format = PHONE_FORMATS[countryCode];
    if (!format) return '+1 555 123 4567';
    
    let number = format.format;
    for (let i = 0; i < number.length; i++) {
      if (number[i] === 'X') {
        number = number.slice(0, i) + Math.floor(Math.random() * 10) + number.slice(i + 1);
      }
    }
    
    return `${format.code} ${number}`;
  }, []);

  const generateEmail = useCallback((countryCode: string, genderChoice: Gender): string => {
    const data = NAMES_DATABASE[countryCode];
    const domains = EMAIL_DOMAINS[countryCode] || ['gmail.com'];
    
    if (!data) return 'user@gmail.com';
    
    const actualGender = genderChoice === 'random' 
      ? (Math.random() > 0.5 ? 'male' : 'female') 
      : genderChoice;
    
    const names = data[actualGender];
    const firstName = random(names.first).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    const lastName = random(names.last).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
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
      <div className="glass-card p-5 mb-6 flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="flex gap-2">
              <button
                onClick={() => setDataType('name')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  dataType === 'name'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                <UserCircle className="w-4 h-4" />
                Имя
              </button>
              <button
                onClick={() => setDataType('phone')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  dataType === 'phone'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                <Phone className="w-4 h-4" />
                Телефон
              </button>
              <button
                onClick={() => setDataType('email')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  dataType === 'email'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
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
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    gender === 'male'
                      ? 'bg-blue-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  Муж
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    gender === 'female'
                      ? 'bg-pink-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  Жен
                </button>
                <button
                  onClick={() => setGender('random')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
          <div>
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
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-dark-400">
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
            className="btn-primary flex items-center gap-2"
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

