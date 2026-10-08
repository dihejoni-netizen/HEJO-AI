/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomeGarden } from './components/HomeGarden';
import { StudioWorkspace } from './components/StudioWorkspace';
import { IdeaGarden } from './components/IdeaGarden';
import { CharacterDNAView } from './components/CharacterDNAView';
import { ProductDNAView } from './components/ProductDNAView';
import { ProjectLibraryView } from './components/ProjectLibraryView';
import { CreativeToolsView } from './components/CreativeToolsView';
import { MotionControlView } from './components/MotionControlView';
import { AccountView } from './components/AccountView';
import { FlowWorkspaceView } from './components/FlowWorkspaceView';
import { UpdateCenterModal } from './components/UpdateCenterModal';
import { VoiceOverModal } from './components/VoiceOverModal';
import { Toast } from './components/Toast';
import { useWorkspaceStore } from './store/workspaceStore';
import { CharacterDNA, IdeaCard, ProductDNA } from './types';
import { sendChatMessage } from './services/aiService';

export default function App() {
  const store = useWorkspaceStore();
  const [isUpdateCenterOpen, setIsUpdateCenterOpen] = useState(false);
  const [isVoiceOverOpen, setIsVoiceOverOpen] = useState(false);
  const [voiceOverInitialText, setVoiceOverInitialText] = useState('');

  // Cross-view actions
  const handleOpenVoiceOver = (initialText?: string, project?: any) => {
    if (project?.id) {
      store.setActiveProjectId(project.id);
    }
    setVoiceOverInitialText(initialText || project?.script || '');
    setIsVoiceOverOpen(true);
  };

  const handleSaveVoiceOverToProject = (audioData: {
    audioUrl: string;
    text: string;
    voiceCharacter: string;
    voiceName: string;
    style: string;
    speed: number;
    durationSeconds: number;
  }) => {
    if (store.activeProject) {
      store.saveProject({
        ...store.activeProject,
        id: store.activeProject.id,
        title: store.activeProject.title,
        voiceOver: {
          audioUrl: audioData.audioUrl,
          durationSeconds: audioData.durationSeconds,
          text: audioData.text,
          voiceCharacter: audioData.voiceCharacter,
          voiceName: audioData.voiceName,
          style: audioData.style,
          speed: audioData.speed,
          createdAt: new Date().toISOString(),
        },
      });
    } else {
      store.saveProject({
        title: `Voice Over - ${audioData.voiceCharacter} (${audioData.style})`,
        category: 'video',
        script: audioData.text,
        status: 'ready',
        voiceOver: {
          audioUrl: audioData.audioUrl,
          durationSeconds: audioData.durationSeconds,
          text: audioData.text,
          voiceCharacter: audioData.voiceCharacter,
          voiceName: audioData.voiceName,
          style: audioData.style,
          speed: audioData.speed,
          createdAt: new Date().toISOString(),
        },
      });
    }
  };
  const handleOpenProjectInStudio = (title: string, script?: string) => {
    store.saveProject({
      title,
      script,
      description: 'Dibuat dari obrolan kreatif dengan HEJO',
      category: 'video',
      status: 'in_progress',
    });
    store.setActiveTab('studio');
  };

  const handleSelectIdeaForChat = (idea: IdeaCard) => {
    store.setActiveTab('home');
    store.addChatMessage({
      sender: 'user',
      text: `Hejo, tolong kembangkan ide ini menjadi konten: "${idea.title}". Format yang cocok ${idea.format}, sudut pandang: ${idea.angle}.`,
    });
  };

  const handleSelectIdeaForStudio = (idea: IdeaCard) => {
    store.saveProject({
      title: idea.title,
      description: `Format: ${idea.format} · Sudut: ${idea.angle}`,
      category: 'video',
      script: `Hook: "${idea.hook}"\n\nAlur Konten:\n1. Masalah / keresahan penonton\n2. Demonstrasi solusi\n3. Call to Action`,
      status: 'draft',
      tags: [idea.niche, idea.format],
    });
    store.setActiveTab('studio');
  };

  const handleUseCharacterInChat = (char: CharacterDNA) => {
    store.setActiveTab('home');
    store.setCreatorContext((prev) => ({
      ...prev,
      karakter: char.name,
      karakterDnaId: char.id,
      characterLock: {
        id: char.id,
        name: char.name,
        description: char.description,
        gender: char.gender,
        ageRange: char.ageRange,
        hair: char.hair,
        faceFeatures: char.faceFeatures,
        outfit: char.outfit,
        personality: char.personality,
        speakingStyle: char.speakingStyle,
        notes: char.visualNotes || char.notes,
        imageUrl: char.imageUrl || char.imageReference,
      },
      character: {
        id: char.id,
        name: char.name,
        description: char.description,
        visualNotes: char.visualNotes || char.notes,
        imageUrl: char.imageUrl || char.imageReference,
      },
      gaya: char.speakingStyle || prev.gaya,
      personality: char.personality || prev.personality,
      audiens: char.ageRange || prev.audiens,
    }));
    store.showToast(`Karakter "${char.name}" telah aktif di Creator Context!`);
    store.addChatMessage({
      sender: 'user',
      text: `Hejo, gunakan karakter ${char.name}.`,
    });
  };

  const handlePromoteProductInStudio = (prod: ProductDNA) => {
    store.saveProject({
      title: `Promosi ${prod.name}`,
      description: `Target: ${prod.targetAudience} · USP: ${prod.usp}`,
      category: 'video',
      productDnaId: prod.id,
      script: `Hook: "Buat kamu yang cari ${prod.category} berkualitas, jangan skip dulu!"\n\nUSP: ${prod.usp}\n\nManfaat: ${prod.keyBenefits.join(', ')}\n\nCTA: Pesan sekarang sebelum kehabisan!`,
      status: 'ready',
      tags: [prod.category, 'Promosi Produk'],
    });
    store.setActiveTab('studio');
    store.showToast(`Studio disiapkan untuk promosi ${prod.name}`);
  };

  const handleSendDraftToChat = async (draftText: string) => {
    store.setActiveTab('home');
    store.addChatMessage({
      sender: 'user',
      text: draftText,
    });

    try {
      const response = await sendChatMessage(
        draftText,
        store.chatMessages,
        store.userMode,
        store.creatorContext
      );

      let mergedContext = { ...store.creatorContext };
      if (response.updatedContext) {
        for (const [key, val] of Object.entries(response.updatedContext)) {
          if (val !== undefined && val !== null && val !== '') {
            (mergedContext as any)[key] = val;
          }
        }
        store.setCreatorContext(mergedContext);
      }

      store.addChatMessage({
        sender: 'hejo',
        text: response.reply,
        quickActions: response.suggestedActions,
        attachedDraft: response.structuredDraft || undefined,
        flowReady: response.flowReady || response.structuredDraft?.flowReady || response.structuredDraft?.meta?.flowReady || undefined,
        multiAffiliate: response.multiAffiliate || response.structuredDraft?.multiAffiliate || response.structuredDraft?.meta?.multiAffiliate || undefined,
        promptPack: response.promptPack || response.structuredDraft?.promptPack || response.structuredDraft?.meta?.promptPack || undefined,
        imageResult: response.imageResult || response.structuredDraft?.imageResult || response.structuredDraft?.meta?.imageResult || undefined,
        creatorContext: mergedContext,
      });
    } catch {
      store.addChatMessage({
        sender: 'hejo',
        text: 'Maaf, terjadi sedikit jeda. Kamu bisa langsung coba lagi ya.',
        quickActions: ['Coba lagi', 'Buat naskah video', 'Cari ide lain'],
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={store.activeTab}
        setActiveTab={store.setActiveTab}
        userMode={store.userMode}
        setUserMode={store.setUserMode}
        projectCount={store.projects.length}
        onOpenUpdateCenter={() => setIsUpdateCenterOpen(true)}
        activeProjectName={store.activeProject?.name || store.activeProject?.title}
        connection={store.googleFlowConnection}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {store.activeTab === 'home' && (
          <HomeGarden
            userMode={store.userMode}
            setActiveTab={store.setActiveTab}
            chatMessages={store.chatMessages}
            addChatMessage={store.addChatMessage}
            saveProject={store.saveProject}
            createProject={store.createProject}
            showToast={store.showToast}
            onOpenProjectInStudio={handleOpenProjectInStudio}
            onOpenFlowWorkspace={store.openFlowWorkspace}
            onOpenVoiceOver={handleOpenVoiceOver}
            projects={store.projects}
            setActiveProjectId={store.setActiveProjectId}
            creatorContext={store.creatorContext}
            setCreatorContext={store.setCreatorContext}
            connection={store.googleFlowConnection}
          />
        )}

        {store.activeTab === 'ideas' && (
          <IdeaGarden
            ideas={store.ideas}
            setIdeas={store.setIdeas}
            userMode={store.userMode}
            setActiveTab={store.setActiveTab}
            showToast={store.showToast}
            onSelectIdeaForChat={handleSelectIdeaForChat}
            onSelectIdeaForStudio={handleSelectIdeaForStudio}
          />
        )}

        {store.activeTab === 'studio' && (
          <StudioWorkspace
            userMode={store.userMode}
            activeProject={store.activeProject}
            saveProject={store.saveProject}
            createProject={store.createProject}
            showToast={store.showToast}
            creatorContext={store.creatorContext}
            setCreatorContext={store.setCreatorContext}
            setActiveTab={store.setActiveTab}
            setActiveProjectId={store.setActiveProjectId}
            projects={store.projects}
            characters={store.characters}
            saveCharacter={store.saveCharacter}
            assignCharacterToProject={store.assignCharacterToProject}
            onOpenVoiceOver={handleOpenVoiceOver}
          />
        )}

        {store.activeTab === 'motion' && (
          <MotionControlView
            userMode={store.userMode}
            showToast={store.showToast}
            creatorContext={store.creatorContext}
            onSendDraftToChat={handleSendDraftToChat}
            setActiveTab={store.setActiveTab}
            activeProject={store.activeProject}
            saveProject={store.saveProject}
          />
        )}

        {store.activeTab === 'characters' && (
          <CharacterDNAView
            characters={store.characters}
            projects={store.projects}
            activeProject={store.activeProject}
            saveCharacter={store.saveCharacter}
            deleteCharacter={store.deleteCharacter}
            assignCharacterToProject={store.assignCharacterToProject}
            setActiveProjectId={store.setActiveProjectId}
            setActiveTab={store.setActiveTab}
            showToast={store.showToast}
            onUseCharacterInChat={handleUseCharacterInChat}
          />
        )}

        {store.activeTab === 'products' && (
          <ProductDNAView
            products={store.products}
            saveProduct={store.saveProduct}
            deleteProduct={store.deleteProduct}
            setActiveTab={store.setActiveTab}
            showToast={store.showToast}
            onPromoteProductInStudio={handlePromoteProductInStudio}
          />
        )}

        {store.activeTab === 'projects' && (
          <ProjectLibraryView
            projects={store.projects}
            saveProject={store.saveProject}
            createProject={store.createProject}
            deleteProject={store.deleteProject}
            setActiveProjectId={store.setActiveProjectId}
            setActiveTab={store.setActiveTab}
            showToast={store.showToast}
            onOpenVoiceOver={handleOpenVoiceOver}
          />
        )}

        {store.activeTab === 'tools' && (
          <CreativeToolsView
            userMode={store.userMode}
            showToast={store.showToast}
            onSendDraftToChat={handleSendDraftToChat}
          />
        )}

        {store.activeTab === 'account' && (
          <AccountView
            user={store.hejoUser}
            flowAccounts={store.flowAccounts}
            activeFlowAccount={store.activeFlowAccount}
            isOAuthConfigured={store.isOAuthConfigured}
            onSetActiveFlowAccount={store.setActiveFlowAccount}
            onRemoveFlowAccount={store.removeFlowAccount}
            onLogout={store.logoutHejo}
            onOpenFlowWorkspace={() => store.openFlowWorkspace()}
            connection={store.googleFlowConnection}
            projectCount={store.projects.length}
            setActiveTab={store.setActiveTab}
            showToast={store.showToast}
          />
        )}

        {store.activeTab === 'flow' && (
          <FlowWorkspaceView
            activeFlowAccount={store.activeFlowAccount}
            connection={store.googleFlowConnection}
            flowPack={store.activeFlowPack}
            onBackToHejo={() => store.setActiveTab('home')}
            onOpenAccount={() => store.setActiveTab('account')}
            showToast={store.showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-stone-100/60 py-6 mt-12 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700">HEJO AI</span>
            <span>·</span>
            <span>Taman Kreator (Creator Workspace)</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">Canggih di belakang, sederhana di depan</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <button
              onClick={() => setIsUpdateCenterOpen(true)}
              className="hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Prinsip & Roadmap
            </button>
            <span>·</span>
            <span>Versi 1.0</span>
          </div>
        </div>
      </footer>

      {/* Modals & Toasts */}
      <UpdateCenterModal
        isOpen={isUpdateCenterOpen}
        onClose={() => setIsUpdateCenterOpen(false)}
      />

      {/* Voice Over Modal (VANA Engine Native di HEJO) */}
      <VoiceOverModal
        isOpen={isVoiceOverOpen}
        onClose={() => setIsVoiceOverOpen(false)}
        initialText={voiceOverInitialText}
        activeProject={store.activeProject}
        onSaveToProject={handleSaveVoiceOverToProject}
        showToast={store.showToast}
      />

      <Toast message={store.toast} />
    </div>
  );
}
