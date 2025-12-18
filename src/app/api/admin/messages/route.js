import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../../../lib/database.js';
import { sendMessageNotificationEmail } from '../../../../../lib/email-service.js';

// GET - Récupérer les messages (admin uniquement)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');

    const db = await connectDB();

    let query = `
      SELECT 
        m.*,
        u.nom,
        u.prenom,
        u.email
      FROM message m
      JOIN utilisateur u ON m.id_utilisateur = u.id_utilisateur
    `;

    const params = [];

    if (statut) {
      query += ' WHERE m.statut = ?';
      params.push(statut);
    }

    query += ' ORDER BY m.date_creation DESC';

    const [messages] = await db.execute(query, params);

    console.log(`📨 ${messages.length} messages récupérés`);

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('❌ Erreur GET messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

// POST - Envoyer un message à l'admin
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sujet, contenu } = body;

    // Validation
    if (!sujet || !contenu) {
      return NextResponse.json(
        { error: 'Sujet et contenu requis' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Insérer le message
    const [result] = await db.execute(
      `INSERT INTO message (id_utilisateur, sujet, contenu, statut, date_creation)
       VALUES (?, ?, ?, 'non_lu', NOW())`,
      [session.user.id, sujet, contenu]
    );

    // Récupérer les infos de l'utilisateur
    const [users] = await db.execute(
      'SELECT nom, prenom, email FROM utilisateur WHERE id_utilisateur = ?',
      [session.user.id]
    );

    const user = users[0];

    // Envoyer notification email à l'admin
    try {
      await sendMessageNotificationEmail(
        'admin@sgtec.com', // Email admin
        `${user.prenom} ${user.nom}`,
        user.email,
        sujet,
        contenu
      );
      console.log('✅ Email de notification envoyé à l\'admin');
    } catch (emailError) {
      console.error('⚠️ Erreur envoi email notification:', emailError);
      // Ne pas bloquer l'envoi du message si l'email échoue
    }

    console.log(`✅ Message créé avec ID: ${result.insertId}`);

    return NextResponse.json(
      { 
        success: true,
        message: 'Message envoyé avec succès',
        id_message: result.insertId
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Erreur POST message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}

// PUT - Marquer un message comme lu/traité (admin uniquement)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id_message, statut } = body;

    if (!id_message || !statut) {
      return NextResponse.json(
        { error: 'ID message et statut requis' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Mettre à jour le statut
    const updateFields = ['statut = ?'];
    const params = [statut];

    if (statut === 'lu' || statut === 'traite') {
      updateFields.push('date_lecture = NOW()');
    }

    await db.execute(
      `UPDATE message SET ${updateFields.join(', ')} WHERE id_message = ?`,
      [...params, id_message]
    );

    console.log(`✅ Message ${id_message} marqué comme ${statut}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Erreur PUT /api/admin/messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du message' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un message (admin seulement)
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id_message = searchParams.get('id_message');

    if (!id_message) {
      return NextResponse.json(
        { error: 'ID du message requis' },
        { status: 400 }
      );
    }

    const connection = await connectDB();
    
    await connection.query(
      'DELETE FROM message WHERE id_message = ?',
      [id_message]
    );

    console.log('✅ Message supprimé:', id_message);

    return NextResponse.json({
      success: true,
      message: 'Message supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur DELETE /api/admin/messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du message' },
      { status: 500 }
    );
  }
}
