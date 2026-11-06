import type { CreatureDefinition } from "./types";
import { crabDefinition } from "./crab/data";
import CrabModel from "./crab/CrabModel";

/**
 * Creature registry. To add a new mechanical creature, create a folder under
 * `src/creatures/<name>/` with `data.ts` (definition: components, animations,
 * specs, camera presets), a `pose.ts` animation generator and a Model component,
 * then register it here with status "online".
 */
function inDevelopment(
  id: string,
  code: string,
  name: string,
  subtitle: string,
  description: string
): CreatureDefinition {
  return {
    ...crabDefinition,
    id,
    code,
    name,
    subtitle,
    description,
    status: "development",
    components: [],
    animations: [],
    Model: undefined,
  };
}

export const CREATURES: CreatureDefinition[] = [
  { ...crabDefinition, Model: CrabModel },
  inDevelopment("octopus", "OC-02", "Mechanical Octopus", "Soft-Robotic Manipulator", "Eight tendon-driven continuum arms for deep-reef intervention."),
  inDevelopment("spider", "SP-03", "Mechanical Spider", "Vertical Surface Climber", "Electro-adhesive climbing platform for structural inspection."),
  inDevelopment("scorpion", "SC-04", "Mechanical Scorpion", "Desert Survey Unit", "Armored sand-walker with a sensor-tipped articulated tail."),
  inDevelopment("mantis", "MT-05", "Mechanical Mantis", "Precision Harvest Unit", "High-speed raptorial arms for delicate agricultural tasks."),
];

export function getCreature(id: string) {
  return CREATURES.find((c) => c.id === id) ?? CREATURES[0];
}
