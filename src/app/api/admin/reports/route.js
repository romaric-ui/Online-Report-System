import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';

const dbConfig = {
  host: process.env.AIVEN_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.AIVEN_USER || process.env.DB_USER || 'root',
  password: process.env.AIVEN_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.AIVEN_DATABASE || process.env.DB_NAME || 'onlinereports',
  port: process.env.AIVEN_PORT || 3306,
};

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// GET - Récupérer TOUS les rapports (admin only)
export async function GET(request) {
  let connection;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier le rôle admin depuis la session
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé: rôle admin requis' },
        { status: 403 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Récupérer tous les rapports avec infos utilisateur
    const [reports] = await connection.execute(
      `SELECT 
        r.*,
        u.nom as createur_nom,
        u.prenom as createur_prenom,
        u.email as createur_email,
        v.nom as validateur_nom,
        v.prenom as validateur_prenom
      FROM Rapport r
      JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
      LEFT JOIN Utilisateur v ON r.id_validateur = v.id_utilisateur
      ORDER BY 
        CASE 
          WHEN r.statut = 'en_attente' OR r.statut IS NULL THEN 0
          ELSE 1
        END,
        r.date_creation DESC`
    );

    console.log(`📋 ${reports.length} rapports récupérés (admin)`);

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('❌ Erreur GET admin reports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rapports' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

// PUT - Valider ou rejeter un rapport (admin only)
export async function PUT(request) {
  let connection;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id_rapport, statut, commentaire_admin } = body;

    // Validation
    if (!id_rapport || !statut) {
      return NextResponse.json(
        { error: 'ID rapport et statut requis' },
        { status: 400 }
      );
    }

    if (!['valide', 'rejete'].includes(statut)) {
      return NextResponse.json(
        { error: 'Statut invalide (valide ou rejete)' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Vérifier le rôle admin depuis la session
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé: rôle admin requis' },
        { status: 403 }
      );
    }

    // Récupérer les infos du rapport et de l'utilisateur
    const [rapportInfo] = await connection.execute(
      `SELECT 
        r.nom_chantier,
        r.numero_rapport,
        u.email,
        u.nom,
        u.prenom
      FROM Rapport r
      JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
      WHERE r.id_rapport = ?`,
      [id_rapport]
    );

    if (rapportInfo.length === 0) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le rapport
    await connection.execute(
      `UPDATE Rapport 
       SET statut = ?, 
           commentaire_admin = ?,
           id_validateur = ?,
           date_validation = NOW(),
           date_modification = NOW()
       WHERE id_rapport = ?`,
      [statut, commentaire_admin || null, session.user.id, id_rapport]
    );

    console.log(`✅ Rapport ${id_rapport} ${statut} par admin ${session.user.id}`);

    // Envoyer email de notification
    try {
      const { email, nom, prenom, nom_chantier, numero_rapport } = rapportInfo[0];
      
      const statutTexte = statut === 'valide' ? 'validé ✅' : 'rejeté ❌';
      const couleur = statut === 'valide' ? '#10b981' : '#ef4444';

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Rapport ${numero_rapport} ${statutTexte}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">OnlineReports</h1>
            </div>
            
            <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151;">Bonjour ${prenom} ${nom},</p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid ${couleur};">
                <h2 style="color: ${couleur}; margin-top: 0;">Rapport ${statutTexte}</h2>
                <p style="color: #6b7280; margin: 10px 0;"><strong>Chantier:</strong> ${nom_chantier}</p>
                <p style="color: #6b7280; margin: 10px 0;"><strong>N° Rapport:</strong> ${numero_rapport}</p>
                ${commentaire_admin ? `
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <p style="color: #374151; margin: 0;"><strong>Commentaire admin:</strong></p>
                    <p style="color: #6b7280; margin: 10px 0 0 0;">${commentaire_admin}</p>
                  </div>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block;
                          font-weight: bold;">
                  Voir mes rapports
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                Ceci est un email automatique, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        `,
      });

      console.log(`📧 Email envoyé à ${email}`);
    } catch (emailError) {
      console.error('⚠️ Erreur envoi email:', emailError);
      // Ne pas bloquer la validation si l'email échoue
    }

    return NextResponse.json({ 
      message: `Rapport ${statut} avec succès`,
      emailSent: true 
    });

  } catch (error) {
    console.error('❌ Erreur PUT admin reports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation du rapport' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE - Supprimer un rapport (admin only)
export async function DELETE(request) {
  let connection;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id_rapport = searchParams.get('id');

    if (!id_rapport) {
      return NextResponse.json(
        { error: 'ID rapport manquant' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Vérifier le rôle admin depuis la session
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé: rôle admin requis' },
        { status: 403 }
      );
    }

    // Supprimer le rapport
    const [result] = await connection.execute(
      'DELETE FROM Rapport WHERE id_rapport = ?',
      [id_rapport]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 }
      );
    }

    console.log(`🗑️ Rapport ${id_rapport} supprimé par admin ${session.user.id}`);

    return NextResponse.json({ message: 'Rapport supprimé avec succès' });

  } catch (error) {
    console.error('❌ Erreur DELETE admin reports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du rapport' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
