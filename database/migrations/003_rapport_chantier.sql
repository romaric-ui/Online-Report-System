ALTER TABLE Rapport ADD COLUMN id_chantier INT;
ALTER TABLE Rapport ADD FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE SET NULL;
CREATE INDEX idx_rapport_chantier ON Rapport(id_chantier);
